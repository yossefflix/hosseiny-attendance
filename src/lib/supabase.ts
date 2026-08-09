import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://rqdgwcxnzstnwhweyzlc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZGd3Y3huenN0bndod2V5emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjU5ODcsImV4cCI6MjEwMTg0MTk4N30.68-Zp0RnWydU9WBBvwQ2nsMJlPmzRluCROXzUt8s25Y';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
