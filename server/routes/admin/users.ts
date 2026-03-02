import express from 'express';
import { protect, AuthenticatedRequest } from '../../middleware/auth';
import { supabase } from '../../utils/supabase';

const router = express.Router();

// Middleware to ensure admin
const adminOnly = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users
router.get('/users', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, department, reg_no, has_free_access, balance, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map snake_case to camelCase for frontend
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      department: u.department,
      regNo: u.reg_no,
      hasFreeAccess: u.has_free_access,
      balance: u.balance || 0,
      createdAt: u.created_at
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle access
router.post('/toggle-access', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, hasFreeAccess } = req.body;
  try {
    const { error } = await supabase
      .from('users')
      .update({ has_free_access: hasFreeAccess })
      .eq('id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle access error:', error);
    res.status(500).json({ error: 'Failed to update access' });
  }
});

// Get chat users (users who have sent messages)
router.get('/chat-users', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    // Get unique sender_ids from messages where receiver is admin (or just get all users for now)
    // For simplicity, let's just return all users, or maybe users with messages.
    // A better approach: fetch distinct user IDs from messages table.
    
    // Since supabase doesn't support distinct on select easily via JS client without raw sql or rpc,
    // we might just fetch all users for now, or fetch messages and process in JS.
    // Fetching all users is fine for this scale.
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, department')
      .neq('is_admin', true); // Exclude other admins if any

    if (error) throw error;

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      department: u.department
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Fetch chat users error:', error);
    res.status(500).json({ error: 'Failed to fetch chat users' });
  }
});

// Update Payment Amount
router.post('/payment-amount', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { amount } = req.body;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'paymentAmount', value: String(amount) });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment amount' });
  }
});

// Update PPT Payment Amount
router.post('/ppt-payment-amount', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { amount } = req.body;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'pptPaymentAmount', value: String(amount) });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update PPT payment amount' });
  }
});

// Update user balance (credit or debit)
router.post('/users/:id/balance', protect, adminOnly, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { amount } = req.body;
  const userId = req.params.id;

  if (amount === undefined || isNaN(amount) || amount === 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('balance, has_free_access')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = (user.balance || 0) + Number(amount);
    
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance for deduction' });
    }

    // Fetch credit value setting
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'credit_value_naira')
      .single();
    
    const creditValueNaira = parseInt(settings?.value || '10000');
    const newCredits = Math.floor(newBalance / creditValueNaira);

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
        amount: Number(amount),
        status: 'successful',
        reference: amount > 0 ? 'Admin Credit' : 'Admin Deduction'
      }]);

    // Create notification
    try {
      const isCredit = amount > 0;
      await supabase.from('notifications').insert([{
        user_id: userId,
        title: isCredit ? 'Wallet Credited' : 'Wallet Debited',
        message: `Your wallet has been ${isCredit ? 'credited with' : 'debited by'} ₦${Math.abs(Number(amount)).toLocaleString()} by admin.`,
        type: 'payment'
      }]);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error('Balance update error:', error);
    res.status(500).json({ error: 'Failed to update user balance' });
  }
});

export default router;
