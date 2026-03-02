import express from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = express.Router();

// Update User Profile
router.put('/:userId', protect, async (req: AuthenticatedRequest, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  const { fullName, department, regNo, gender } = req.body;
  
  // Ensure user can only update their own profile unless admin
  if (String(req.user.id) !== String(req.params.userId) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

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
    balance: user.balance,
    project_credits: user.project_credits
  };
  
  res.json({ user: userObj });
});

export default router;
