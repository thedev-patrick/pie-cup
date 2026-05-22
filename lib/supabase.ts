import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// Returns null when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.
// Callers must guard: `const sb = getSupabaseClient(); if (sb) { ... }`
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}
