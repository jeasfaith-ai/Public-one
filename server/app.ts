import dotenv from 'dotenv';
dotenv.config();
import express from "express";
console.log('--- EXPRESS APP LOADING (server/app.ts) ---');
console.log('Express app (server/app.ts) initialized');
import authRouter from './auth';
import projectsRouter from './routes/projects';
import topupRouter from './routes/topup';
import adminTopupRouter from './routes/admin/topup';
import adminUsersRouter from './routes/admin/users';
import adminPricingRouter from './routes/admin/pricing';
import adminBackupRouter from './routes/admin/backup';
import { protect, admin } from './middleware/auth';
import walletRouter from './routes/wallet';
import transactionsRouter from './routes/transactions';
import notificationsRouter from './routes/notifications';
import supportRouter from './routes/support';
import geminiRouter from './routes/gemini';
import aiRouter from './routes/ai';
import usersRouter from './routes/users';
import cors from 'cors';
import { supabase } from './utils/supabase';
import bcrypt from 'bcryptjs';

const app = express();

// Seed Admin User
let adminSeeded = false;
async function seedAdmin() {
  if (adminSeeded) return;
  if (!supabase) {
    console.log('Skipping admin seed: Supabase client not initialized.');
    return;
  }
    const email = 'rexbaba540@gmail.com';
    const password = 'password123'; // User should change this
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      console.log(`Checking if admin user exists: ${email}`);
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!user) {
        console.log('Seeding admin user...');
        await supabase.from('users').insert([{
          email,
          password: hashedPassword,
          full_name: 'Admin User',
          department: 'Administration',
          reg_no: 'ADMIN2',
          is_admin: true,
          has_free_access: true,
          balance: 0
        }]);
      }
    } catch (e) {
      console.error('Seed error for rexbaba540@gmail.com:', e);
    }

    const email2 = 'drexxieofficial@gmail.com';
    const password2 = '311868';
    const hashedPassword2 = bcrypt.hashSync(password2, 10);

    try {
      console.log(`Checking if admin user exists: ${email2}`);
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email2)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching admin user:', fetchError);
      }

      if (!user) {
        console.log('Seeding admin user...');
        const { error: insertError } = await supabase.from('users').insert([{
          email: email2,
          password: hashedPassword2,
          full_name: 'Admin',
          department: 'Administration',
          reg_no: 'ADMIN',
          is_admin: true,
          has_free_access: true,
          balance: 0
        }]);
        if (insertError) {
          console.error('Error inserting admin user:', insertError);
        } else {
          console.log('Admin user seeded successfully.');
        }
      } else {
        // Optionally update password to ensure it matches our seed
        console.log('Admin user exists, ensuring password is up to date...');
        const { error: updateError } = await supabase.from('users').update({ password: hashedPassword2 }).eq('email', email2);
        if (updateError) {
          console.error('Error updating admin password:', updateError);
        } else {
          console.log('Admin password updated successfully.');
        }
      }
      adminSeeded = true;

    // Seed Settings
    console.log('Seeding default settings...');
    const defaultSettings = [
      { key: 'paymentAmount', value: '5000' },
      { key: 'pptPaymentAmount', value: '5000' },
      { key: 'project_cost_credits', value: '1' },
      { key: 'credit_value_naira', value: '1000' },
      { key: 'paymentAccounts', value: '[{"bankName":"WEMA BANK PLC","accountNumber":"8543944389","accountName":"rtechsse"},{"bankName":"CASHCONNET MICROFINANCE BANK","accountNumber":"9912023600","accountName":"rtechsse"},{"bankName":"STERLING BANK PLC","accountName":"8513808366","accountName":"rtechsse"}]' }
    ];

    for (const setting of defaultSettings) {
      const { error: settingError } = await supabase
        .from('settings')
        .upsert(setting, { onConflict: 'key' });
      if (settingError) {
        console.error(`Error seeding setting ${setting.key}:`, settingError);
      }
    }
    console.log('Settings seeded successfully.');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Call seedAdmin on startup only if not in serverless environment (heuristic)
// In serverless, we should probably trigger this via a dedicated route or build step
if (process.env.NODE_ENV !== 'production' || process.env.SEED_ON_START === 'true') {
  seedAdmin();
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is reachable', 
    timestamp: new Date().toISOString(),
    path: req.path,
    url: req.url,
    method: req.method
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'SET' : (process.env.VITE_SUPABASE_URL ? 'SET (VITE)' : 'MISSING'),
      supabaseKey: process.env.SUPABASE_ANON_KEY ? 'SET' : (process.env.VITE_SUPABASE_ANON_KEY ? 'SET (VITE)' : 'MISSING'),
      geminiKey: process.env.GEMINI_API_KEY ? 'SET' : (process.env.VITE_GEMINI_API_KEY ? 'SET (VITE)' : 'MISSING'),
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// API Routes
const mountRoutes = (router: any) => {
  router.use('/support', supportRouter); 
  router.use('/auth', (req: any, res: any, next: any) => {
    console.log(`Auth Route Hit: ${req.method} ${req.url}`);
    next();
  }, authRouter);
  router.use('/projects', protect, projectsRouter);
  router.use('/admin/topup', protect, admin, adminTopupRouter);
  router.use('/admin/pricing', protect, admin, adminPricingRouter);
  router.use('/admin/backup', protect, admin, adminBackupRouter);
  router.use('/topup', protect, topupRouter);
  router.use('/admin', protect, admin, adminUsersRouter);
  router.use('/notifications', protect, notificationsRouter);
  router.use('/wallet', protect, walletRouter);
  router.use('/transactions', protect, transactionsRouter);
  router.use('/gemini', (req: any, res: any, next: any) => {
    console.log(`Gemini Route Hit: ${req.method} ${req.url}`);
    next();
  }, geminiRouter); // Protect is handled inside the router
  router.use('/ai', protect, aiRouter);
  router.use('/users', protect, usersRouter);
};

// Mount at /api for local dev and standard redirects
const apiRouter = express.Router();
mountRoutes(apiRouter);
app.use('/api', apiRouter);

// Also mount at / for Netlify redirects that strip /api
mountRoutes(app);

app.get('/api/db-check', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ status: 'error', message: 'Supabase client not initialized' });
  }
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed or table missing', 
        details: error.message
      });
    }
    res.json({ status: 'ok', message: 'Database connected', userCount: count });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: 'Unexpected database error', details: err.message });
  }
});

// API 404 handler - REMOVED to allow fallthrough to Vite
// app.use('/api', (req, res) => { ... });

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

export default app;
