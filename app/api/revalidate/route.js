import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) return Response.json({ ok: false, error: 'no token' }, { status: 401 });

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );

    const { data: { user } } = await supa.auth.getUser();
    if (!user) return Response.json({ ok: false, error: 'invalid token' }, { status: 401 });

    const { data: admin } = await supa
      .from('marketplace_admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!admin) return Response.json({ ok: false, error: 'not admin' }, { status: 403 });

    revalidatePath('/', 'layout');
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
