import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zoijagrhrirmjvilswxt.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // Server-side
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }

  // Client-side singleton
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        'Supabase URL or Anon Key is missing. Real-time WebSockets fallback will be used.',
      );
      return null;
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseClient;
}
