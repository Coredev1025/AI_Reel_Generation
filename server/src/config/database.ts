import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index';
import { logger } from '../utils/logger';

let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
  }
  return supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('Supabase admin client initialized');
  }
  return supabaseAdmin;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('users').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      logger.error('Database connection test failed', { error: error.message });
      return false;
    }
    logger.info('Database connection successful');
    return true;
  } catch (err) {
    logger.error('Database connection test failed', { error: err });
    return false;
  }
}
