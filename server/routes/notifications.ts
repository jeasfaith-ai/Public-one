import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Get notifications for a user
router.get('/', protect, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized in notifications route');
      return res.status(503).json({ error: 'Database service is unavailable' });
    }

    if (!req.user || !req.user.id) {
      console.error('User not found in request in notifications route');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Fetching notifications for user: ${req.user.id}`);
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching notifications:', error);
      throw error;
    }

    res.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Error in notifications route:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Create a notification (Admin only or system)
router.post('/', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { userId, title, message, type } = req.body;
  
  // Only allow if user is admin or it's a system notification
  if (!req.user.isAdmin && type !== 'system') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type: type || 'system'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;
