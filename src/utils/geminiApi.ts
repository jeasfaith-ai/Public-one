import { GoogleGenAI } from "@google/genai";
import { clientFetch } from "./api";
import { supabase } from "./supabase";

// Cache for API keys to avoid fetching on every request
let cachedKeys: string[] = [];
let keyFetchPromise: Promise<string[]> | null = null;

// Fetch keys from backend
const fetchKeysFromBackend = async (): Promise<string[]> => {
  if (cachedKeys.length > 0) return cachedKeys;
  if (keyFetchPromise) return keyFetchPromise;

  keyFetchPromise = (async () => {
    try {
      console.log("[Gemini Client] Fetching API keys from backend...");
      const res = await clientFetch('/api/gemini/keys');
      if (!res.ok) {
        console.warn(`[Gemini Client] Backend fetch failed with status: ${res.status}`);
        return [];
      }
      const data = await res.json();
      if (data.keys && Array.isArray(data.keys) && data.keys.length > 0) {
        cachedKeys = data.keys;
        console.log(`[Gemini Client] Loaded ${cachedKeys.length} keys from backend.`);
        return cachedKeys;
      }
      return [];
    } catch (error) {
      console.warn("[Gemini Client] Error fetching keys from backend:", error);
      return [];
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

  const keys = new Set<string>();

  // 1. Try fetching from Backend API
  const backendKeys = await fetchKeysFromBackend();
  backendKeys.forEach(k => keys.add(k));

  // 2. Try fetching from Supabase (Direct DB Access)
  if (keys.size === 0 && supabase) {
    try {
      console.log("[Gemini Client] Attempting to fetch keys from Supabase...");
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
            console.log(`[Gemini Client] Loaded ${keys.size} keys from Supabase.`);
          }
        } catch (e) {
          console.error("[Gemini Client] Failed to parse gemini_api_keys from DB:", e);
        }
      }
    } catch (err) {
      console.error("[Gemini Client] Error fetching Gemini keys from DB:", err);
    }
  }

  // 3. Fallback to Env Vars (Vite Build-Time)
  if (keys.size === 0) {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) {
      console.log("[Gemini Client] Falling back to VITE_GEMINI_API_KEY");
      keys.add(envKey);
    }
    
    // Check for comma-separated keys
    const multiKeys = import.meta.env.VITE_GEMINI_API_KEYS;
    if (multiKeys) {
      multiKeys.split(',').forEach((key: string) => {
        if (key.trim()) keys.add(key.trim());
      });
    }
  }

  // Initialize Clients
  keys.forEach(apiKey => {
    clients.push({
      apiKey,
      client: new GoogleGenAI({ apiKey }),
      isRateLimited: false,
      rateLimitResetTime: 0
    });
  });

  if (clients.length === 0) {
    console.error("[Gemini Client] CRITICAL: No API keys found from any source.");
  }
};

// Fallback to backend proxy if client-side fails
async function* generateContentViaBackendProxy(params: any): AsyncGenerator<any> {
  console.log("[Gemini Client] Falling back to Backend Proxy...");
  try {
    // Prepare payload for backend
    // The backend expects { model, contents, config }
    // We need to ensure contents is in a format the backend understands
    // The backend uses the same SDK, so passing params.contents directly (if formatted) should work
    // But params.contents here might be raw string or array.
    
    // Let's format it simply for the backend
    let finalContents = params.contents;
    if (Array.isArray(params.contents) && params.contents[0]?.parts) {
      // It's already formatted for SDK, backend should handle it
    } else if (typeof params.contents === 'string') {
      // String is fine
    }

    const response = await clientFetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        contents: finalContents,
        config: params.config
      })
    });

    if (!response.ok) {
      throw new Error(`Backend proxy failed with status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Backend proxy returned no body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Backend sends raw text chunks
      if (chunk) {
        yield { text: chunk };
      }
    }
  } catch (error: any) {
    console.error("[Gemini Client] Backend proxy failed:", error);
    throw new Error(`All methods failed. Client: Failed to fetch. Backend: ${error.message}`);
  }
}

export async function* generateContentStreamWithRetries(params: any): AsyncGenerator<any> {
  await initializeClients();

  // If no clients, try backend proxy immediately
  if (clients.length === 0) {
    console.warn("[Gemini Client] No client keys. Using backend proxy.");
    yield* generateContentViaBackendProxy(params);
    return;
  }

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

  // If all client-side attempts failed, try backend proxy
  console.warn("[Gemini Client] All client keys failed. Falling back to backend proxy.");
  try {
    yield* generateContentViaBackendProxy(params);
  } catch (backendError: any) {
    throw lastError || backendError;
  }
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
