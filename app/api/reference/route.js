import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendMail } from '../../../lib/mailer';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refitport.com';

// Firma bir referans eklediğinde çağrılır: kaptana token'lı onay maili yollar
export async function POST(req) {
  try {
    const { referenceId } = await req.json();
    if (!referenceId) return Response.json({ ok: false, error: 'no id' }, { status: 400 });

    const supa = supabaseAdmin();
    const { data: ref } = await supa
      .from('marketplace_references')
      .select('*, marketplace_companies(name)')
      .eq('id', referenceId).single();
    if (!ref) return Response.json({ ok: false, error: 'not found' }, { status: 404 });

    const companyName = ref.marketplace_companies?.name || 'Bir firma';
    const approveUrl = `${BASE}/tr/referans?token=${ref.token}`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0d1b2b">
        <h2 style="color:#0d1b2b">RefitPort — Referans Onayı</h2>
        <p><strong>${companyName}</strong>, RefitPort profilinde sizi referans olarak göstermek istiyor.</p>
        <p><strong>Tekne:</strong> ${ref.boat_name}<br>
           <strong>Yapılan iş:</strong> ${ref.work_summary}</p>
        <p>Bu referansı onaylıyorsanız aşağıdaki bağlantıya tıklayın:</p>
        <p><a href="${approveUrl}" style="display:inline-block;background:#0d1b2b;color:#fff;
           padding:12px 22px;border-radius:8px;text-decoration:none">Referansı görüntüle ve onayla</a></p>
        <p style="color:#8fa7bd;font-size:13px">Bu bağlantı 30 gün geçerlidir. Sizi ilgilendirmiyorsa
           bu e-postayı yok sayabilirsiniz; onaylanmayan referans yayınlanmaz.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0">
        <p style="color:#8fa7bd;font-size:12px">RefitPort — a SuperyachtApps product</p>
      </div>`;

    await sendMail({
      to: ref.contact_email,
      subject: `RefitPort — ${companyName} referans onayı`,
      html,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// Kaptan onay/red kararını gönderir (referans sayfasından)
export async function PATCH(req) {
  try {
    const { token, decision, displayMode, displayLabel } = await req.json();
    if (!token || !['approved', 'rejected'].includes(decision))
      return Response.json({ ok: false, error: 'bad request' }, { status: 400 });

    const supa = supabaseAdmin();
    const { data: ref } = await supa
      .from('marketplace_references').select('*').eq('token', token).single();
    if (!ref) return Response.json({ ok: false, error: 'not found' }, { status: 404 });
    if (ref.status !== 'pending')
      return Response.json({ ok: false, error: 'already decided' }, { status: 409 });
    if (new Date(ref.expires_at) < new Date())
      return Response.json({ ok: false, error: 'expired' }, { status: 410 });

    await supa.from('marketplace_references').update({
      status: decision,
      display_mode: displayMode === 'anonymous' ? 'anonymous' : 'named',
      display_label: displayMode === 'anonymous' ? (displayLabel || null) : null,
      decided_at: new Date().toISOString(),
    }).eq('id', ref.id);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
