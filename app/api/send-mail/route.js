import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendMail } from '../../../lib/mailer';
import { escapeHtml } from '../../../lib/escapeHtml';

// Yeni lead oluştuğunda firmaya bildirim yollar
export async function POST(req) {
  try {
    const { leadId } = await req.json();
    if (!leadId) return Response.json({ ok: false, error: 'no id' }, { status: 400 });

    const supa = supabaseAdmin();
    const { data: lead } = await supa
      .from('marketplace_leads')
      .select('*, marketplace_companies(name,email)')
      .eq('id', leadId).single();
    if (!lead) return Response.json({ ok: false, error: 'not found' }, { status: 404 });

    const to = lead.marketplace_companies?.email;
    if (!to) return Response.json({ ok: true, skipped: 'no company email' });

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0d1b2b">
        <h2>RefitPort — Yeni İletişim Talebi</h2>
        <p><strong>${escapeHtml(lead.name)}</strong> sizinle iletişime geçmek istiyor.</p>
        <p><strong>E-posta:</strong> ${escapeHtml(lead.email)}<br>
           ${lead.phone ? `<strong>Telefon:</strong> ${escapeHtml(lead.phone)}<br>` : ''}
           ${lead.boat_name ? `<strong>Tekne:</strong> ${escapeHtml(lead.boat_name)}<br>` : ''}
           ${lead.date_from ? `<strong>Tarih:</strong> ${escapeHtml(lead.date_from)} → ${escapeHtml(lead.date_to || '')}<br>` : ''}
        </p>
        <p><strong>Mesaj:</strong><br>${escapeHtml(lead.message)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0">
        <p style="color:#8fa7bd;font-size:12px">RefitPort — a SuperyachtApps product</p>
      </div>`;

    await sendMail({ to, subject: `RefitPort — ${lead.name} sizinle iletişime geçmek istiyor`, html });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('send-mail error:', e);
    return Response.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}
