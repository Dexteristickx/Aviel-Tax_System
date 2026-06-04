import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  !!(supabaseUrl && supabaseAnonKey) && 
  !supabaseUrl.includes('xxxxxxxxxxxxxxxxxxxx') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('XXXX');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: {}, error: new Error("Supabase is not configured. Falling back to local mode.") }),
        signUp: async () => ({ data: {}, error: new Error("Supabase is not configured. Falling back to local mode.") }),
        signOut: async () => ({ error: null })
      }
    };
