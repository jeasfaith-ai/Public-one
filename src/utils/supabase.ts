import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qggnsmtcnnhlshlsboqz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZ25zbXRjbm5obHNobHNib3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzI5OTEsImV4cCI6MjA4NzIwODk5MX0.54TaTJifF8-moB-QjIKEUXtOKlnnHe0NB_ka0FUD5ro';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
