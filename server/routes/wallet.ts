import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Deduct balance
router.post('/deduct', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, amount, description } = req.body;

  if (String(req.user.id) !== String(userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, has_free_access')
      .eq('id', userId)
      .single();

    if (fetchError || !user) throw fetchError || new Error('User not found');

    const currentBalance = user.balance || 0;
    const deductAmount = parseFloat(amount);

    if (currentBalance < deductAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = currentBalance - deductAmount;
    const newCredits = Math.floor(newBalance / 1000); // Reverted 10000 back to 1000 to restore original logic

    // Update balance and sync credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        project_credits: newCredits
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction
    await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: -deductAmount,
        status: 'successful',
        reference: description || 'Balance Deduction'
      }]);

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Deduct error:', error);
    res.status(500).json({ error: 'Failed to deduct balance' });
  }
});

// Deduct project credit
router.post('/deduct-project-credit', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const userId = req.user.id;

  try {
    // Get current user and settings
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, project_credits, has_free_access')
      .eq('id', userId)
      .single();

    if (fetchError || !user) throw fetchError || new Error('User not found');

    if (user.has_free_access) {
      return res.json({ success: true, message: 'Free access granted' });
    }

    // Get project cost settings
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['project_cost_credits', 'credit_value_naira']);

    const costInCredits = Number(settings?.find(s => s.key === 'project_cost_credits')?.value || '1');
    const creditValueNaira = Number(settings?.find(s => s.key === 'credit_value_naira')?.value || '1000');
    const costInNaira = costInCredits * creditValueNaira;

    let updateData = {};
    let transactionData = null;

    if (user.project_credits >= costInCredits) {
      // Prioritize using credits
      const newCredits = user.project_credits - costInCredits;
      // Also deduct the corresponding balance to keep them in sync
      const newBalance = Math.max(0, (user.balance || 0) - costInNaira);
      
      updateData = { 
        project_credits: newCredits,
        balance: newBalance
      };
      
      transactionData = {
        user_id: userId,
        amount: -costInNaira, // Record the value deducted
        status: 'successful',
        reference: `Project Generation (Used ${costInCredits} Credit)`
      };
    } else if ((user.balance || 0) >= costInNaira) {
      // Use balance if no credits
      const newBalance = (user.balance || 0) - costInNaira;
      // If we want to keep credits in sync with balance (1 credit = 10k naira)
      const newCredits = Math.floor(newBalance / creditValueNaira);
      
      updateData = { 
        balance: newBalance,
        project_credits: newCredits
      };
      
      transactionData = {
        user_id: userId,
        amount: -costInNaira,
        status: 'successful',
        reference: 'Project Generation (Balance Deduction)'
      };
    } else {
      return res.status(400).json({ error: 'Insufficient balance or credits. You need at least 1 credit or ₦' + costInNaira.toLocaleString() + ' to generate a project.' });
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction if applicable
    if (transactionData) {
      await supabase.from('transactions').insert([transactionData]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Deduct project credit error:', error);
    res.status(500).json({ error: 'Failed to deduct project credit' });
  }
});

// Get transactions
router.get('/transactions/:userId', protect, async (req: AuthenticatedRequest, res) => {
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

// Verify payment (placeholder for real verification, used by Flutterwave previously)
router.post('/verify', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, amount, reference } = req.body;
  
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, has_free_access')
      .eq('id', userId)
      .single();

    if (fetchError || !user) throw fetchError || new Error('User not found');

    const newBalance = (user.balance || 0) + parseFloat(amount);
    const newCredits = Math.floor(newBalance / 1000);

    await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        project_credits: newCredits
      })
      .eq('id', userId);

    await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: parseFloat(amount),
        status: 'successful',
        reference: reference || 'Wallet Top Up'
      }]);

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
