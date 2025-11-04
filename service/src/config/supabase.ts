import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Supabase is optional - if not configured, only basic faucet functionality will work
// (no claim history tracking)
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase connected - claim history tracking enabled');
} else {
  console.warn('⚠️  Supabase not configured - running without claim history tracking');
  console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY to enable history tracking');
}

export const supabase = supabaseClient;

// Database types
export interface FaucetClaim {
  id: string;
  address: string;
  amount: string;
  tx_hash: string;
  chain_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}
