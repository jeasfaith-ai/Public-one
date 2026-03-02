import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Get Payment Accounts
router.get('/payment-accounts', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  console.log('Fetching payment accounts...');
  try {
    const { data: setting, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'paymentAccounts')
      .single();

    if (error) {
      console.error('Supabase error fetching payment accounts:', error);
    }

    if (setting && setting.value) {
      const accounts = JSON.parse(setting.value);
      console.log(`Found ${accounts.length} payment accounts in database`);
      res.json({ accounts });
    } else {
      console.log('No payment accounts found in database, returning empty list');
      res.json({ accounts: [] });
    }
  } catch (error) {
    console.error('Fetch payment accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch payment accounts' });
  }
});

// Get Pricing Plans
router.get('/plans', protect, async (req: AuthenticatedRequest, res) => {
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

router.post('/', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { name, email, transactionId, amount, bank, projectCredits } = req.body;

  if (!name || !email || !transactionId || !amount || !bank) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const { data: topUpRequest, error } = await supabase
      .from('top_up_requests')
      .insert([{
        user_id: req.user.id,
        name,
        email,
        transaction_id: transactionId,
        amount: parsedAmount,
        bank,
        project_credits: projectCredits || 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error submitting top-up:', error);
      throw error;
    }
    
    res.status(201).json(topUpRequest);
  } catch (error: any) {
    console.error('Top-up request error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit top-up request. Please try again.' });
  }
});

export default router;
