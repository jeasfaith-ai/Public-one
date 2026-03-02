import express from 'express';
import { protect, admin, AuthenticatedRequest } from '../../middleware/auth';
import { supabase } from '../../utils/supabase';

const router = express.Router();

// Get top-up requests
router.get('/', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  console.log('Admin Topup: Fetching requests...');
  try {
    const { data: requests, error } = await supabase
      .from('top_up_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Admin Topup: Supabase error:', error);
      throw error;
    }
    
    console.log(`Admin Topup: Found ${requests?.length} requests`);
    res.json(requests);
  } catch (error) {
    console.error('Admin Topup: Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch top-up requests' });
  }
});

// Update Payment Accounts
router.post('/payment-accounts', protect, admin, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { accounts } = req.body;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'paymentAccounts', value: JSON.stringify(accounts) });

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Update payment accounts error:', error);
    res.status(500).json({ error: 'Failed to update payment accounts' });
  }
});

router.post('/:id/approve', protect, admin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: request, error: fetchError } = await supabase
      .from('top_up_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { error: updateRequestError } = await supabase
      .from('top_up_requests')
      .update({ status: 'APPROVED' })
      .eq('id', req.params.id);

    if (updateRequestError) throw updateRequestError;

    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('balance, project_credits, has_free_access')
      .eq('id', request.user_id)
      .single();

    if (userFetchError || !user) throw userFetchError || new Error('User not found');

    // Fetch credit value setting (default 10000)
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'credit_value_naira')
      .single();
    
    const creditValueNaira = parseInt(settings?.value || '10000');

    // Calculate new balance
    const newBalance = (user.balance || 0) + request.amount;

    const newCredits = Math.floor(newBalance / creditValueNaira);

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        project_credits: newCredits
      })
      .eq('id', request.user_id);

    if (userUpdateError) throw userUpdateError;
    
    // Record transaction
    await supabase
      .from('transactions')
      .insert([{
        user_id: request.user_id,
        amount: request.amount,
        status: 'successful',
        reference: `Top-up Approved (${request.bank})`
      }]);

    // Create notification
    await supabase
      .from('notifications')
      .insert([{
        user_id: request.user_id,
        title: 'Top-up Approved',
        message: `Your top-up request of ₦${request.amount.toLocaleString()} has been approved and credited to your balance.`,
        type: 'payment'
      }]);

    res.json({ success: true });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve top-up request' });
  }
});

router.post('/:id/reject', protect, admin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: request } = await supabase
      .from('top_up_requests')
      .select('user_id, amount')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('top_up_requests')
      .update({ status: 'REJECTED' })
      .eq('id', req.params.id);

    if (error) throw error;

    if (request) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: request.user_id,
          title: 'Top-up Rejected',
          message: `Your top-up request of ₦${request.amount.toLocaleString()} has been rejected. Please contact support if you believe this is an error.`,
          type: 'payment'
        }]);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject top-up request' });
  }
});

export default router;
