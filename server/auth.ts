import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './utils/supabase';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key-change-me';

// Register
router.post('/register', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  let { email, password, fullName, department, regNo, gender } = req.body;
  
  if (!email || !password || !fullName || !department || !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Normalize inputs
  email = email.trim().toLowerCase();
  fullName = fullName.trim();
  department = department.trim();
  regNo = regNo ? regNo.trim() : '';

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if regNo exists (only if provided and not empty)
    if (regNo && regNo.length > 0) {
      const { data: existingRegNo } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('reg_no', regNo)
        .single();

      if (existingRegNo) {
        return res.status(400).json({ error: 'Registration number already exists. If this is you, please log in.' });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        full_name: fullName,
        department,
        reg_no: regNo || null, // Store null if empty
        gender,
        balance: 0,
        project_credits: 0,
        is_admin: email === 'drexxieofficial@gmail.com' || email === 'rexbaba540@gmail.com',
        has_free_access: email === 'drexxieofficial@gmail.com' || email === 'rexbaba540@gmail.com'
      }])
      .select()
      .single();

    if (error || !user) {
      throw error || new Error('Failed to create user');
    }

    // Create welcome notification
    try {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: 'Welcome to Stress No More! 🎓',
        message: 'Ready to ace your final year? Get started by purchasing credits to generate professional, plagiarism-free projects and defense scripts in minutes. Don\'t just graduate—excel with our premium tools! Click "Top Up" to begin your journey to success.',
        type: 'system'
      }]);
    } catch (notifError) {
      console.error('Failed to create welcome notification:', notifError);
      // Do not fail registration if notification fails
    }
    
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

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, SECRET_KEY);
    
    res.json({ token, user: userObj });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error', details: error.message || JSON.stringify(error) });
  }
});

// Login
router.post('/login', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  let { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  // Normalize email
  email = email.trim().toLowerCase();

  try {
    console.log(`Login attempt for email: ${email}`);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error(`Login Supabase Error for ${email}:`, error);
      // If user not found, error.code is usually 'PGRST116'
      if (error.code === 'PGRST116') {
         console.log(`User not found: ${email}`);
         return res.status(401).json({ error: 'Invalid credentials' });
      }
      throw error;
    }
    
    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log(`Password match for ${email}: ${passwordMatch}`);
    
    if (!user || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
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

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, SECRET_KEY);
    
    res.json({ token, user: userObj });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message || JSON.stringify(error) });
  }
});

// Get User Profile (Protected)
router.get('/me', async (req, res) => {
  console.log('GET /api/auth/me hit');
  if (!supabase) {
    console.error('Supabase is null in /me');
    return res.status(503).json({ error: 'Database service is unavailable' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, SECRET_KEY);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    
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
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
