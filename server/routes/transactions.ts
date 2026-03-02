import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Get transactions
router.get('/:userId', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId } = req.params;
  
  if (String(req.user.id) !== String(userId) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Delete all transactions for a user
router.delete('/all/:userId', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId } = req.params;

  if (String(req.user.id) !== String(userId) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete all transactions error:', error);
    res.status(500).json({ error: 'Failed to clear transaction history' });
  }
});

// Delete a transaction
router.delete('/:id', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (String(transaction.user_id) !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
