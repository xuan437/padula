import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qqqtdlxmvawszygefkpg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxcXRkbHhtdmF3c3p5Z2Vma3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5ODg4NjgsImV4cCI6MjEwODU2NDg2OH0.KAV6QLkseCgYem7wZ_aLDPGm1-1gbB19DIjWzArsAPI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

