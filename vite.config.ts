import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Collect all Gemini keys into an array
  const geminiKeys = [];
  if (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY) {
    geminiKeys.push(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
  }
  if (env.GEMINI_API_KEYS || env.VITE_GEMINI_API_KEYS) {
    (env.GEMINI_API_KEYS || env.VITE_GEMINI_API_KEYS).split(',').forEach(k => {
      if (k.trim()) geminiKeys.push(k.trim());
    });
  }
  for (let i = 1; i <= 20; i++) {
    const key = env[`GEMINI_API_KEY_${i}`] || env[`VITE_GEMINI_API_KEY_${i}`];
    if (key) geminiKeys.push(key);
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_ALL_GEMINI_KEYS': JSON.stringify(geminiKeys),
      'import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY': JSON.stringify(env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-e393116bd9d4eda9dd70644246831b01-Xp'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://qggnsmtcnnhlshlsboqz.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZ25zbXRjbm5obHNobHNib3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzI5OTEsImV4cCI6MjA4NzIwODk5MX0.54TaTJifF8-moB-QjIKEUXtOKlnnHe0NB_ka0FUD5ro'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
