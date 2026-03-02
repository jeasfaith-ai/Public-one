import express from 'express';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../utils/supabase';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to check and deduct balance
const deductBalance = async (userId: string, amount: number) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('balance, project_credits')
    .eq('id', userId)
    .single();

  if (error || !user) throw new Error('User not found');

  // Check credits first (1 credit = 10000)
  if ((user.project_credits || 0) >= 1) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ project_credits: user.project_credits - 1 })
      .eq('id', userId);
    if (updateError) throw new Error('Failed to deduct credit');
    return true;
  }

  if ((user.balance || 0) >= amount) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', userId);
    if (updateError) throw new Error('Failed to deduct balance');
    return true;
  }

  throw new Error('Insufficient balance or credits. Please top up.');
};

// AI Image Generation
router.post('/generate-image', protect, async (req: AuthenticatedRequest, res) => {
  const { userId, prompt } = req.body;
  
  if (!userId || !prompt) return res.status(400).json({ error: 'Missing required fields' });

  try {
    await deductBalance(userId, 10000);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });

    let imageBase64 = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBase64) throw new Error('Failed to generate image');

    res.json({ image: `data:image/png;base64,${imageBase64}` });
  } catch (error: any) {
    console.error('AI Image Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Consistent Character Generation
router.post('/consistent-character', protect, async (req: AuthenticatedRequest, res) => {
  const { userId, prompt, imageBase64 } = req.body;
  
  if (!userId || !prompt || !imageBase64) return res.status(400).json({ error: 'Missing required fields' });

  try {
    await deductBalance(userId, 10000);
    
    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: `Generate a consistent 3D cartoon character based on this image. ${prompt}` }
        ]
      }
    });

    let generatedImage = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImage = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedImage) throw new Error('Failed to generate character');

    res.json({ image: `data:image/png;base64,${generatedImage}` });
  } catch (error: any) {
    console.error('Consistent Character Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate character' });
  }
});

// Storyboard Generation
router.post('/storyboard', protect, async (req: AuthenticatedRequest, res) => {
  const { userId, story } = req.body;
  
  if (!userId || !story) return res.status(400).json({ error: 'Missing required fields' });

  try {
    await deductBalance(userId, 10000);
    
    // 1. Generate Scenes Description
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Create a 4-scene storyboard for this story. For each scene, provide a visual description for a 3D cartoon style image and an animation prompt. Format as JSON: [{ "scene": 1, "description": "...", "animationPrompt": "..." }] \n\nStory: ${story}` }] }
    });

    const text = textResponse.text;
    // Extract JSON
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) throw new Error('Failed to generate storyboard structure');
    
    const scenes = JSON.parse(jsonMatch[0]);
    const generatedScenes = [];

    // 2. Generate Images for each scene (Limit to 4 to save time/resources)
    for (const scene of scenes.slice(0, 4)) {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `3D cartoon style: ${scene.description}` }] }
      });

      let imgData = '';
      if (imgResponse.candidates?.[0]?.content?.parts) {
        for (const part of imgResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            imgData = part.inlineData.data;
            break;
          }
        }
      }

      generatedScenes.push({
        ...scene,
        image: imgData ? `data:image/png;base64,${imgData}` : null
      });
    }

    res.json({ scenes: generatedScenes });
  } catch (error: any) {
    console.error('Storyboard Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate storyboard' });
  }
});

export default router;
