import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { generateContentWithRetries, hasKeys } from '../utils/geminiApi';
import { ThinkingLevel } from '@google/genai';

const router = express.Router();

// Get Gemini Keys for Client-Side Use (Avoids Netlify Timeouts)
router.get('/keys', (req, res) => {
  console.log('Request for Gemini keys received');
  const keys: string[] = [];
  
  // Collect keys from server environment
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
    console.log('Found GEMINI_API_KEY');
  }
  if (process.env.GEMINI_API_KEYS) {
    console.log('Found GEMINI_API_KEYS list');
    process.env.GEMINI_API_KEYS.split(',').forEach(k => {
      if (k.trim()) keys.push(k.trim());
    });
  }
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
      console.log(`Found GEMINI_API_KEY_${i}`);
    }
  }

  // Also check VITE_ prefixed ones just in case
  if (process.env.VITE_GEMINI_API_KEY) {
    keys.push(process.env.VITE_GEMINI_API_KEY);
    console.log('Found VITE_GEMINI_API_KEY');
  }

  // Deduplicate
  const uniqueKeys = [...new Set(keys)];
  console.log(`Total unique keys found: ${uniqueKeys.length}`);

  if (uniqueKeys.length === 0) {
    console.error('CRITICAL: No Gemini API keys found in environment variables');
    return res.status(500).json({ error: 'No Gemini API keys configured on server' });
  }

  res.json({ keys: uniqueKeys });
});

// Test Gemini Connection
router.get('/test', protect, async (req: AuthenticatedRequest, res) => {
  console.log('[Gemini Test] Starting connection test...');
  if (!hasKeys()) {
    return res.status(500).json({ 
      error: "No Gemini API keys configured on server.", 
      details: "Please set GEMINI_API_KEY in Netlify environment variables." 
    });
  }

  try {
    const response = await generateContentWithRetries({
      model: 'gemini-3-flash-preview',
      contents: 'Hello, are you there? Respond with "YES" if you are working.',
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.1,
      }
    });

    console.log('[Gemini Test] Success:', response.text);
    res.json({ 
      status: 'success', 
      message: 'Gemini API is working from backend.',
      response: response.text 
    });
  } catch (error: any) {
    console.error("[Gemini Test] Failed:", error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Gemini API failed from backend.',
      error: error.message,
      details: error.toString()
    });
  }
});

// EDU 432 Questions
router.post('/edu432', protect, async (req: AuthenticatedRequest, res) => {
  const { text, base64Data, mimeType, mode } = req.body;
  
  const courseNotes = `
  QUALITY ASSURANCE NOTE: 
  EDU 432 Quality Assurance in Education.
  Concepts: Quality Assurance, Accountability, Supervision and Support, Evaluation and Improvement, Regulation.
  Nature: Continuous, Systematic, Scientific, Preventive, Corrective, Selective, Graded, Supportive, Participatory.
  Types of Inspection: Routine, Surprise, Full, Partial, Subject-based, Follow-up, Diagnostic, Advisory, Internal, External.
  Theories: Autocratic (Traditional), Democratic (Modern), Scientific, Human Relations, Clinical Supervision (Developmental), Systems Theory.
  Problems in Nigeria: Inadequate Funding, Shortage of Qualified Inspectors, Poor Training, Corruption, Negative Attitude of Teachers, Poor Follow-up, Political Interference, Inadequate Facilities, Overcrowding.
  Prospects: Quality Improvement, Professional Development, Use of Modern Technology, Strengthening Accountability, Policy Review, Capacity Building, Collaboration.
  `;

  let prompt = "";
  if (mode === 'quiz-answers') {
    prompt = `Act as an expert in EDU 432 Quality Assurance. Based on the provided course notes and the user's input (image or text), provide the CORRECT answers to the quiz questions. Give ONLY the answers in a ready-to-write format. 
    Notes context: ${courseNotes}`;
  } else if (mode === 'exam-questions') {
    prompt = `Act as an expert examiner for EDU 432 Quality Assurance. Based on the course notes, generate 10 high-probability EXAM questions (Theory and Objective). 
    Notes context: ${courseNotes}`;
  } else if (mode === 'quiz-questions') {
    prompt = `Act as an expert in EDU 432 Quality Assurance. Generate 20 practice QUIZ questions (Multiple Choice) based on the course notes. 
    Notes context: ${courseNotes}`;
  }

  try {
    const parts: any[] = [{ text: prompt }];
    if (text) parts.push({ text: `User Input: ${text}` });
    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data.split(',')[1] || base64Data
        }
      });
    }

    const response = await generateContentWithRetries({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.2,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini EDU432 Error:", error);
    res.status(500).json({ error: "Failed to process EDU 432 request with Gemini." });
  }
});

// Extract Grades
router.post('/extract-grades', protect, async (req: AuthenticatedRequest, res) => {
  const { base64Data, mimeType } = req.body;
  
  const prompt = `Extract academic results from this document. For each course, identify the Course Name/Code, the Grade (A, B, C, D, E, or F), and the Credit Load (Units). 
  Return the data as a JSON array of objects with keys: "name", "grade", and "creditLoad". 
  Example: [{"name": "MTH101", "grade": "A", "creditLoad": 3}]. 
  If credit load is not found, default to 3. Only return the JSON array, nothing else.`;

  try {
    const response = await generateContentWithRetries({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data.split(',')[1] || base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    res.status(500).json({ error: "Failed to extract grades with Gemini." });
  }
});

// Identify Object
router.post('/identify', protect, async (req: AuthenticatedRequest, res) => {
  const { base64Image } = req.body;
  
  const prompt = `Identify the object(s) in this image. Provide a detailed description, its common uses, and any interesting facts about it. 
  If it's a person, describe their appearance and what they are doing. 
  If it's a device, mention its likely model or type. 
  Keep the tone informative and helpful.`;

  try {
    const response = await generateContentWithRetries({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.2,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Identification Error:", error);
    res.status(500).json({ error: "Failed to identify object with Gemini." });
  }
});

// Solve Questions (Image or File)
router.post('/solve', protect, async (req: AuthenticatedRequest, res) => {
  const { base64Data, mimeType } = req.body;
  
  const prompt = `Solve these questions immediately. Give ONLY the answers. No explanations. No context. Ready-to-write format.`;

  try {
    const response = await generateContentWithRetries({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Data.split(',')[1] || base64Data
            }
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.1,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Solve Error:", error);
    res.status(500).json({ error: "Failed to process request with Gemini." });
  }
});

// Generic Generate Content
router.post('/generate', protect, async (req: AuthenticatedRequest, res) => {
  if (!hasKeys()) {
    return res.status(500).json({ 
      error: "No Gemini API keys configured on server.", 
      details: "Please set GEMINI_API_KEY in Netlify environment variables." 
    });
  }

  const { model, prompt, contents, config } = req.body;
  
  // Use contents if provided, otherwise use prompt
  const finalContents = contents || prompt;

  if (!finalContents) {
    return res.status(400).json({ 
      error: "Missing 'contents' or 'prompt' in request body.",
      receivedBody: req.body
    });
  }

  try {
    const response = await generateContentWithRetries({
      model: model || 'gemini-3-flash-preview',
      contents: finalContents,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        ...(config || {})
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    // Return the actual error message to help debugging
    res.status(500).json({ 
      error: error.message || "Failed to generate content with Gemini.",
      details: error.toString()
    });
  }
});

export default router;
