import { GoogleGenAI } from "@google/genai";
import { clientFetch } from "./api";

// Cache for API keys to avoid fetching on every request
let cachedKeys: string[] = [];
let keyFetchPromise: Promise<string[]> | null = null;

// Fetch keys from backend
const fetchKeys = async (): Promise<string[]> => {
  if (cachedKeys.length > 0) return cachedKeys;
  if (keyFetchPromise) return keyFetchPromise;

  keyFetchPromise = (async () => {
    try {
      console.log("[Gemini Client] Fetching API keys from backend...");
      const res = await clientFetch('/api/gemini/keys');
      if (!res.ok) throw new Error("Failed to fetch API keys");
      const data = await res.json();
      if (data.keys && Array.isArray(data.keys) && data.keys.length > 0) {
        cachedKeys = data.keys;
        console.log(`[Gemini Client] Loaded ${cachedKeys.length} keys.`);
        return cachedKeys;
      }
      throw new Error("No keys returned from backend");
    } catch (error) {
      console.error("[Gemini Client] Error fetching keys:", error);
      // Fallback to env var if available in build (unlikely in production if not exposed)
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey) {
        console.log("[Gemini Client] Falling back to VITE_GEMINI_API_KEY");
        return [envKey];
      }
      throw error;
    } finally {
      keyFetchPromise = null;
    }
  })();

  return keyFetchPromise;
};

interface GeminiClientState {
  apiKey: string;
  client: GoogleGenAI;
  isRateLimited: boolean;
  rateLimitResetTime: number;
}

const clients: GeminiClientState[] = [];

const initializeClients = async () => {
  if (clients.length > 0) return;

  const keys = await fetchKeys();
  keys.forEach(apiKey => {
    clients.push({
      apiKey,
      client: new GoogleGenAI({ apiKey }),
      isRateLimited: false,
      rateLimitResetTime: 0
    });
  });
};

export async function* generateContentStreamWithRetries(params: any): AsyncGenerator<any> {
  await initializeClients();

  const now = Date.now();
  // Reset rate limits if time passed
  clients.forEach(c => {
    if (c.isRateLimited && now > c.rateLimitResetTime) {
      c.isRateLimited = false;
      c.rateLimitResetTime = 0;
    }
  });

  // Get available clients
  let availableClients = clients.filter(c => !c.isRateLimited);
  if (availableClients.length === 0) {
    // If all rate limited, try the one with oldest reset time or just all of them
    console.warn("[Gemini Client] All keys rate limited. Retrying with all keys...");
    availableClients = [...clients];
  }
  
  // Shuffle to distribute load
  availableClients.sort(() => Math.random() - 0.5);

  let lastError: any = null;

  for (const clientState of availableClients) {
    try {
      console.log(`[Gemini Client] Generating with key ending in ...${clientState.apiKey.slice(-4)}`);
      
      // Prepare contents for SDK
      let formattedContents: any[] = [];
      if (typeof params.contents === 'string') {
        formattedContents = [{ role: 'user', parts: [{ text: params.contents }] }];
      } else if (Array.isArray(params.contents)) {
        formattedContents = params.contents.map((c: any) => {
          if (c.parts && !c.role) return { role: 'user', parts: c.parts };
          if (c.parts && c.role) return c;
          if (c.parts) return { role: 'user', parts: c.parts };
          return { role: 'user', parts: [{ text: String(c) }] };
        });
      } else if (params.contents && params.contents.parts) {
        formattedContents = [{ role: 'user', parts: params.contents.parts }];
      } else {
        throw new Error("Invalid contents format");
      }

      const formattedParams = {
        model: params.model || 'gemini-3-flash-preview',
        contents: formattedContents,
        config: params.config
      };

      const stream = await clientState.client.models.generateContentStream(formattedParams);

      for await (const chunk of stream) {
        yield chunk;
      }
      
      return; // Success
    } catch (error: any) {
      console.error(`[Gemini Client] Error with key ...${clientState.apiKey.slice(-4)}:`, error.message);
      
      const isRateLimit = error.status === 429 || 
                          error.status === 503 || 
                          (error.message && (
                            error.message.includes('429') || 
                            error.message.includes('RESOURCE_EXHAUSTED') || 
                            error.message.includes('quota') ||
                            error.message.includes('limit')
                          ));

      if (isRateLimit) {
        clientState.isRateLimited = true;
        clientState.rateLimitResetTime = Date.now() + 60000; // 1 minute penalty
      } else {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys failed.");
}

export async function generateContentWithRetries(params: any): Promise<any> {
  let fullText = "";
  let lastChunk: any = null;
  
  for await (const chunk of generateContentStreamWithRetries(params)) {
    fullText += chunk.text || "";
    lastChunk = chunk;
  }
  
  if (!lastChunk && !fullText) throw new Error("No content generated");
  
  return {
    text: fullText
  };
}
