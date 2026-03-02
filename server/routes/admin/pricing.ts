import express from 'express';
import { protect, admin, AuthenticatedRequest } from '../../middleware/auth';
import { supabase } from '../../utils/supabase';

const router = express.Router();

// Get all pricing plans
router.get('/plans', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: plans, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('projects_count', { ascending: true });

    if (error) throw error;
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// Update or create a pricing plan
router.post('/plans', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { id, projects_count, price_naira } = req.body;

  try {
    if (id) {
      const { data, error } = await supabase
        .from('pricing_plans')
        .update({ projects_count, price_naira })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } else {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert([{ projects_count, price_naira }])
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pricing plan' });
  }
});

// Delete a pricing plan
router.delete('/plans/:id', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { error } = await supabase
      .from('pricing_plans')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

// Get site settings
router.get('/settings', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*');
    if (error) throw error;
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

import { refreshKeys } from '../../utils/geminiApi';

// Update a setting
router.post('/settings', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { key, value } = req.body;
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value: String(value) })
      .select()
      .single();
    if (error) throw error;

    // If updating Gemini keys, refresh the clients
    if (key === 'gemini_api_keys') {
      console.log('Gemini keys updated in DB, refreshing clients...');
      await refreshKeys();
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
