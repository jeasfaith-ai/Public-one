import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Get Project Cost Settings (Public)
router.get('/project-cost', async (req, res) => {
  console.log('GET /api/support/project-cost hit (SUPPORT ROUTER)');
  if (!supabase) {
    console.error('Supabase not initialized in support router');
    return res.status(503).json({ error: 'Database service is unavailable' });
  }
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['project_cost_credits', 'credit_value_naira']);

    const costInCredits = settings?.find(s => s.key === 'project_cost_credits')?.value || '1';
    const creditValueNaira = settings?.find(s => s.key === 'credit_value_naira')?.value || '10000';

    console.log('Project cost settings:', { costInCredits, creditValueNaira });
    res.json({ 
      costInCredits: Number(costInCredits),
      creditValueNaira: Number(creditValueNaira)
    });
  } catch (error) {
    console.error('Error in project-cost route:', error);
    res.status(500).json({ error: 'Failed to fetch project cost settings' });
  }
});

// Get Support Contact (Admin ID)
router.get('/support-contact', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Support contact not found' });
    }
    res.json({ adminId: admin.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support contact' });
  }
});

// Get Messages between current user and another user
router.get('/messages/:otherUserId', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const currentUserId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedMessages = messages.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      read: m.read,
      createdAt: m.created_at
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send Message
router.post('/messages', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { senderId, receiverId, content } = req.body;

  if (String(senderId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        content
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.post('/messages/read', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, senderId } = req.body; // userId is current user (receiver), senderId is the other user

  if (String(userId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', senderId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get Payment Amount (Public)
router.get('/payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'paymentAmount')
      .single();

    res.json({ amount: setting ? Number(setting.value) : 5000 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment amount' });
  }
});

// Get PPT Payment Amount (Public)
router.get('/ppt-payment-amount', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'pptPaymentAmount')
      .single();

    res.json({ amount: setting ? Number(setting.value) : 5000 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PPT payment amount' });
  }
});

export default router;
