import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env whether started from root or from backend folder
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !str.includes('<your-project-ref>');
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return isValidHttpUrl(rawUrl) && Boolean(rawKey && !rawKey.includes('your_supabase'));
};

const clientUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const clientKey = (rawKey && !rawKey.includes('your_supabase')) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(
  clientUrl,
  clientKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured with valid project credentials.',
    };
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: false,
          message: 'Connected to Supabase, but tables do not exist yet. Please run backend/supabase/schema.sql in the Supabase SQL Editor.',
        };
      }
      return {
        connected: false,
        message: `Supabase query error: ${error.message} (Code: ${error.code})`,
      };
    }
    return { connected: true, message: 'Successfully connected to Supabase PostgreSQL database.' };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${err?.message || err}`,
    };
  }
};
