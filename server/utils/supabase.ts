import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qggnsmtcnnhlshlsboqz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZ25zbXRjbm5obHNobHNib3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzI5OTEsImV4cCI6MjA4NzIwODk5MX0.54TaTJifF8-moB-QjIKEUXtOKlnnHe0NB_ka0FUD5ro';

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase credentials missing in environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set.');
  console.error('Current values:', { 
    supabaseUrl: supabaseUrl ? 'SET' : 'MISSING', 
    supabaseKey: supabaseKey ? 'SET' : 'MISSING',
    usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
} else {
  console.log('Supabase Connection: Initializing client for', supabaseUrl);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Supabase Connection: Using Service Role Key (Bypasses RLS)');
  } else {
    console.log('Supabase Connection: Using Anon Key (Subject to RLS)');
  }
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;
