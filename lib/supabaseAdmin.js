import { createClient } from '@supabase/supabase-js';

// Yalnızca sunucu tarafı (API route). service_role anahtarı ASLA istemciye gitmez.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
