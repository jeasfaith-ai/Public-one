import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabase";

interface GeminiClient {
  apiKey: string;
  client: GoogleGenAI;
  isRateLimited: boolean;
  rateLimitResetTime: number;
}

const geminiClients: GeminiClient[] = [];
let isInitialized = false;

// Initialize Gemini clients from environment variables and database
export const initializeClients = async () => {
  geminiClients.length = 0; // Clear existing
  const keys = new Set<string>();

  // Check for comma-separated keys in env
  const multiKeys = process.env.GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEYS;
  if (multiKeys) {
    multiKeys.split(',').forEach(key => {
      const trimmedKey = key.trim();
      if (trimmedKey) keys.add(trimmedKey);
    });
  }

  // Check for single key in env
  const singleKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (singleKey) keys.add(singleKey);

  // Check for numbered keys in env
  for (let i = 1; i <= 20; i++) {
    const apiKey = process.env[`GEMINI_API_KEY_${i}`] || process.env[`VITE_GEMINI_API_KEY_${i}`];
    if (apiKey) keys.add(apiKey);
  }

  // Fetch keys from database settings
  if (supabase) {
    try {
      const { data: setting, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'gemini_api_keys')
        .single();
      
      if (setting && setting.value) {
        try {
          const dbKeys = JSON.parse(setting.value);
          if (Array.isArray(dbKeys)) {
            dbKeys.forEach((k: string) => {
              if (k && typeof k === 'string' && k.trim()) keys.add(k.trim());
            });
          }
        } catch (e) {
          console.error("Failed to parse gemini_api_keys from DB:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching Gemini keys from DB:", err);
    }
  }

  keys.forEach(apiKey => {
    geminiClients.push({
      apiKey,
      client: new GoogleGenAI({ apiKey }),
      isRateLimited: false,
      rateLimitResetTime: 0
    });
  });

  if (geminiClients.length === 0) {
    console.error("CRITICAL: No Gemini API keys configured. Project generation will fail.");
    console.error("Please set GEMINI_API_KEY in environment variables or 'gemini_api_keys' in settings table.");
  } else {
    console.log(`Initialized ${geminiClients.length} Gemini API clients.`);
  }
  
  isInitialized = true;
};

// Initialize on load (fire and forget)
initializeClients();

export const hasKeys = () => geminiClients.length > 0;

export const refreshKeys = async () => {
  await initializeClients();
};

export async function* generateContentStreamWithRetries(params: any): AsyncGenerator<any> {
  if (geminiClients.length === 0 && !isInitialized) {
    await initializeClients();
  }
  
  // If still no keys, try one more time if initialized failed or was empty
  if (geminiClients.length === 0) {
     await initializeClients();
     if (geminiClients.length === 0) {
       throw new Error("No Gemini API keys configured. Please contact support.");
     }
  }

  const now = Date.now();
  geminiClients.forEach(client => {
    if (client.isRateLimited && now > client.rateLimitResetTime) {
      client.isRateLimited = false;
      client.rateLimitResetTime = 0;
    }
  });

  let availableClients = geminiClients.filter(client => !client.isRateLimited);
  if (availableClients.length === 0) availableClients = [...geminiClients];
  availableClients.sort(() => Math.random() - 0.5);

  let lastError: any = null;

  for (const client of availableClients) {
    try {
      console.log(`[Gemini] Calling generateContentStream with model: ${params.model || 'default'}`);
      
      // Ensure contents is in the correct format for the SDK
      let formattedContents: any[] = [];
      if (typeof params.contents === 'string') {
        formattedContents = [{ role: 'user', parts: [{ text: params.contents }] }];
      } else if (Array.isArray(params.contents)) {
        formattedContents = params.contents.map((c: any) => {
          if (c.parts && !c.role) return { role: 'user', parts: c.parts };
          if (c.parts && c.role) return c;
          // If it's just an object with parts but no role, it might be the { parts: [...] } format
          if (c.parts) return { role: 'user', parts: c.parts };
          return { role: 'user', parts: [{ text: String(c) }] };
        });
      } else if (params.contents && params.contents.parts) {
        formattedContents = [{ role: 'user', parts: params.contents.parts }];
      } else {
        console.error("[Gemini] Invalid contents format:", params.contents);
        throw new Error("Invalid Gemini contents format");
      }

      const formattedParams = {
        model: params.model || 'gemini-3-flash-preview',
        contents: formattedContents,
        config: params.config
      };

      console.log("[Gemini] Formatted Params for SDK:", JSON.stringify({
        model: formattedParams.model,
        contentsCount: formattedParams.contents.length,
        config: formattedParams.config
      }));

      if (!formattedParams.contents) {
        console.error("[Gemini] CRITICAL: contents is missing in formattedParams", params);
        throw new Error("Gemini contents is missing");
      }

      const stream = await client.client.models.generateContentStream(formattedParams);
      for await (const chunk of stream) {
        yield chunk;
      }
      return; // Success
    } catch (error: any) {
      console.error(`Gemini Streaming API call failed with key ending in ...${client.apiKey.slice(-4)}:`, error.message);
      
      const isRateLimit = error.status === 429 || 
                          error.status === 503 || 
                          (error.message && (
                            error.message.includes('429') || 
                            error.message.includes('RESOURCE_EXHAUSTED') || 
                            error.message.includes('quota') ||
                            error.message.includes('limit')
                          ));

      if (isRateLimit) {
        client.isRateLimited = true;
        client.rateLimitResetTime = Date.now() + 60000;
      } else {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys failed for streaming.");
}

export async function generateContentWithRetries(params: any): Promise<any> {
  let fullText = "";
  let lastChunk: any = null;
  
  for await (const chunk of generateContentStreamWithRetries(params)) {
    fullText += chunk.text || "";
    lastChunk = chunk;
  }
  
  if (!lastChunk) throw new Error("No content generated");
  
  // Return something that looks like the original response object
  return {
    ...lastChunk,
    text: fullText
  };
}

