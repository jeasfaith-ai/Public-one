import { clientFetch } from "./api";

export async function* generateContentStreamWithRetries(params: any): AsyncGenerator<any> {
  try {
    console.log(`[Gemini] Calling backend proxy for ${params.model || 'default'}...`);
    
    // Ensure contents is in the correct format before sending to backend
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
      console.error("[Gemini] Invalid contents format:", params.contents);
      throw new Error("Invalid Gemini contents format");
    }

    const response = await clientFetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model,
        contents: formattedContents,
        config: params.config
      })
    });

    console.log(`[Gemini] Backend response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorData: any = { error: 'Unknown error' };
      let responseText = '';
      try {
        responseText = await response.text();
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error(`[Gemini] Backend returned non-JSON response: ${responseText.substring(0, 500)}`);
        errorData = { 
          error: `Server returned ${response.status}: ${response.statusText}`, 
          details: responseText.substring(0, 200),
          fullResponse: responseText.substring(0, 1000)
        };
      }
      
      const finalErrorMessage = errorData.error || errorData.message || `Backend error ${response.status}`;
      console.error(`[Gemini] Throwing error: ${finalErrorMessage}`, errorData);
      throw new Error(finalErrorMessage);
    }

    const data = await response.json();
    yield { text: data.text };
  } catch (error: any) {
    console.error("[Gemini] API call failed via backend:", error.message);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Failed to connect to the backend server. Please check your internet connection or if the server is down.");
    }
    throw error;
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
