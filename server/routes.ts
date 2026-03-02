import express from 'express';
import axios from 'axios';
import { supabase } from './utils/supabase';

const router = express.Router();

// Real Flutterwave Verification
router.post('/wallet/verify', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, amount, reference } = req.body;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    console.error('FLUTTERWAVE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const { status, data } = response.data;

    if (status === 'success' && data.status === 'successful' && data.amount >= amount) {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const newBalance = (user.balance || 0) + parseFloat(amount);

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          amount: parseFloat(amount),
          type: 'deposit',
          status: 'successful',
          reference: reference,
          description: 'Wallet Topup (Verified)'
        }]);

      return res.json({ success: true, balance: newBalance });
    } else {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error: any) {
    console.error('Flutterwave verification error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// Get Payment Amount
router.get('/payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['project_cost_credits', 'credit_value_naira', 'paymentAmount']);
    
    const settingsMap = (settings || []).reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const projectCostCredits = parseFloat(settingsMap.project_cost_credits || '1');
    const creditValueNaira = parseFloat(settingsMap.credit_value_naira || '10000');
    
    // Default to 10000 if no settings found, or use the calculated value
    const amount = projectCostCredits * creditValueNaira;
    
    res.json({ amount: isNaN(amount) ? 10000 : amount });
  } catch (err) {
    console.error('Error fetching payment amount:', err);
    res.json({ amount: 10000 });
  }
});

// Get PPT Payment Amount
router.get('/ppt-payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pptPaymentAmount')
    .single();
    
  res.json({ amount: setting ? parseFloat(setting.value) : 5000 });
});

// Record Transaction
router.post('/transactions', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, amount, reference, status } = req.body;
  await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      amount,
      reference,
      status,
      type: 'payment'
    }]);
  res.json({ success: true });
});

// Get User Transactions
router.get('/transactions/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
    
  const mappedTransactions = (transactions || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    amount: t.amount,
    type: t.type,
    status: t.status,
    reference: t.reference,
    description: t.description,
    createdAt: t.created_at
  }));
    
  res.json({ transactions: mappedTransactions });
});

// Save Project
router.post('/projects', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, topic, content, details, is_premium_generated } = req.body;
  
  const { data: project, error } = await supabase
    .from('projects')
    .insert([{
      user_id: userId,
      topic,
      content,
      details,
      is_premium_generated
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Error saving project:', error);
    return res.status(500).json({ error: 'Failed to save project' });
  }
  
  res.json(project);
});

// Update Project
router.put('/projects/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { topic, content, details, is_premium_generated } = req.body;
  
  const { data: project, error } = await supabase
    .from('projects')
    .update({
      topic,
      content,
      details,
      is_premium_generated
    })
    .eq('id', req.params.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
  
  res.json(project);
});

// Delete Project
router.delete('/projects/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id);
    
  if (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
  
  res.json({ success: true });
});

// Get User Projects
router.get('/projects/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
    
  const mappedProjects = (projects || []).map(p => ({
    id: p.id,
    userId: p.user_id,
    topic: p.topic,
    content: p.content,
    details: p.details,
    is_premium_generated: p.is_premium_generated,
    createdAt: p.created_at
  }));
    
  res.json({ projects: mappedProjects });
});

// Delete Transaction
router.delete('/transactions/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', req.params.id);
    
  if (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
  
  res.json({ success: true });
});

// Clear All Transactions
router.delete('/transactions/all/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', req.params.userId);
    
  if (error) {
    console.error('Error clearing transactions:', error);
    return res.status(500).json({ error: 'Failed to clear transactions' });
  }
  
  res.json({ success: true });
});

// Update User Profile
router.put('/users/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { fullName, department, regNo, gender } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      department,
      reg_no: regNo,
      gender
    })
    .eq('id', req.params.userId)
    .select()
    .single();
    
  if (error || !user) return res.status(500).json({ error: 'Failed to update user' });
  
  const userObj = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    department: user.department,
    regNo: user.reg_no,
    gender: user.gender,
    isAdmin: user.is_admin,
    hasFreeAccess: user.has_free_access,
    balance: user.balance
  };
  
  res.json({ user: userObj });
});

// Messages
router.get('/messages/:otherUserId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const currentUserId = parseInt(req.headers['x-user-id'] as string);
  const otherUserId = parseInt(req.params.otherUserId);
  
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true });
    
  res.json({ messages: messages || [] });
});

router.post('/messages', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { senderId, receiverId, content } = req.body;
  const { data: message, error } = await supabase
    .from('messages')
    .insert([{
      sender_id: senderId,
      receiver_id: receiverId,
      content
    }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: 'Failed to send message' });
  res.json({ message });
});

router.post('/messages/read', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, senderId } = req.body;
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId);
  res.json({ success: true });
});

// Get Chat Users (for Admin)
router.get('/admin/chat-users', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  // This is a bit more complex in Supabase without a custom view
  // For now, let's get all users who are not admin
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_admin', false);
    
  const mappedUsers = (users || []).map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    department: u.department,
    regNo: u.reg_no,
    isAdmin: u.is_admin,
    hasFreeAccess: u.has_free_access,
    balance: u.balance
  }));
  
  res.json({ users: mappedUsers });
});

// Get Support Contact (Admin)
router.get('/support-contact', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { data: admin } = await supabase
    .from('users')
    .select('*')
    .eq('is_admin', true)
    .limit(1)
    .single();
    
  if (admin) {
    res.json({ adminId: admin.id, name: admin.full_name });
  } else {
    res.status(404).json({ error: 'Support not available' });
  }
});

// ADMIN ROUTES

// Get All Users
router.get('/admin/users', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_admin', false);
    
  const mappedUsers = (users || []).map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    department: u.department,
    regNo: u.reg_no,
    isAdmin: u.is_admin,
    hasFreeAccess: u.has_free_access,
    balance: u.balance
  }));
  
  res.json({ users: mappedUsers });
});

// Toggle Free Access
router.post('/admin/toggle-access', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, hasFreeAccess } = req.body;
  await supabase
    .from('users')
    .update({ has_free_access: hasFreeAccess })
    .eq('id', userId);
  res.json({ success: true });
});

// Update Payment Amount
router.post('/admin/payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { amount } = req.body;
  await supabase
    .from('settings')
    .upsert({ key: 'paymentAmount', value: amount.toString() }, { onConflict: 'key' });
  res.json({ success: true });
});

// Update PPT Payment Amount
router.post('/admin/ppt-payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { amount } = req.body;
  await supabase
    .from('settings')
    .upsert({ key: 'pptPaymentAmount', value: amount.toString() }, { onConflict: 'key' });
  res.json({ success: true });
});

import { GoogleGenAI } from "@google/genai";

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
router.post('/ai/generate-image', async (req, res) => {
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
router.post('/ai/consistent-character', async (req, res) => {
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
router.post('/ai/storyboard', async (req, res) => {
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
