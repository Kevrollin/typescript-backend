import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Validate Supabase configuration
if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.warn('⚠️  Supabase credentials not configured. Image uploads will fail.');
  console.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
}

// Initialize Supabase client with service role key for server-side operations
// Service role key bypasses RLS policies, which is what we need for server-side uploads
export const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || config.supabase.anonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabase;

