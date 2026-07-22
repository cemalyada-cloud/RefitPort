'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../../lib/supabaseBrowser';
import { pick } from '../../../lib/i18n';

const L = {
  tr: { title:'Admin Paneli', queue:'Onay Kuyruğu', revisions:'Değişiklik Onayları',
        companies:'Firmalar', featured:'Vitrin Slotları', claims:'Sahiplenme Talepleri',
        approve:'Onayla', reject:'Reddet', suspend:'Askıya al', publish:'Yayına al',
        empty:'Kayıt yok.', logout:'Çıkış', noAccess:'Bu sayfaya erişim yetkiniz yok.',
        assign:'Slot ata', region:'Bölge', category:'Kategori', company:'Firma',
        until:'Bitiş tarihi', remove:'Kaldır', slotFull:'Bu bölge+kategori için 3 slot dolu.',
        refresh:'Sayfalar tazelendi.', pendingRefs:'Bekleyen Referanslar',
        approveRef:'Referansı onayla (manuel)', founding:'Kurucu üye', mark:'İşaretle', refreshBtn:'Sayfaları Tazele' },
  en: { title:'Admin Panel', queue:'Approval Queue', revisions:'Change Requests',
        companies:'Companies', featured:'Featured Slots', claims:'Claim Requests',
        approve:'Approve', reject:'Reject', suspend:'Suspend', publish:'Publish',
        empty:'Nothing here.', logout:'Sign out', noAccess:'You do not have access to this page.',
        assign:'Assign slot', region:'Region', category:'Category', company:'Company',
        until:'End date', remove:'Remove', slotFull:'3 slots already filled for this region+category.',
        refresh:'Pages refreshed.', pendingRefs:'Pending References',
        approveRef:'Approve reference (manual)', founding:'Founding member', mark:'Mark', refreshBtn:'Refresh Pages' },
};

const inp = { width:'100%', height:42, background:'var(--navy-soft)', color:'var(--white)',
  border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:8, fontSize:'.88rem' };
const btnSm = { width:'auto', padding:'8px 14px', fontSize:'.8rem' };

export default function Admin({ params }) {
  const { lang } = params;
  const s = L[lang] || L.tr;
  const router = useRouter();

  const [ok, setOk] = useState(null);
  const [pending, setPending] = useState([]);
  const [revs, setRevs] = useState([]);
  const [all, setAll] = useState([]);
  const [slots, setSlots] = useState([]);
  const [claims, setClaims] = useState([]);
  const [pendingRefs, setPendingRefs] = useState([]);
  const [cats, setCats] = useState([]);
  const [regs, setRegs] = useState([]);
  const [msg, setMsg] = useState('');
  const [slotForm, setSlotForm] = useState({ region:'', category:'', company:'', until:'' });

  const load = useCallback(async () => {
    const { data: { session } } = await sb().auth.getSession();
    if (!session) { router.replace(`/${lang}/giris`); return; }
    const { data: admin } = await sb().from('marketplace_admins')
      .select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (!admin) { setOk(false); return; }
    setOk(true);

    const [{ data: p }, { data: rv }, { data: a }, { data: sl }, { data: cl }, { data: pr },
           { data: cs }, { data: rs }] = await Promise.all([
      sb().from('marketplace_companies').select('*').eq('status','pending').order('created_at'),
      sb().from('marketplace_company_revisions').select('*').eq('status','pending').order('created_at'),
      sb().from('marketplace_companies').select('*').order('name'),
      sb().from('marketplace_featured_slots').select('*').eq('active', true),
      sb().from('marketplace_claim_requests').select('*').eq('status','pending'),
      sb().from('marketplace_references').select('*').eq('status','pending').order('requested_at'),
      sb().from('marketplace_categories').select('*').order('sort_order'),
      sb().from('marketplace_regions').select('*').order('sort_order'),
    ]);
    setPending(p||[]); setRevs(rv||[]); setAll(a||[]); setSlots(sl||[]);
    setClaims(cl||[]); setPendingRefs(pr||[]); setCats(cs||[]); setRegs(rs||[]);
  }, [lang, router]);

  useEffect(() => { load(); }, [load]);

  async function refreshPages() {
    const { data: { session } } = await sb().auth.getSession();
    await fetch('/api/revalidate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token: session.access_token }),
    });
    setMsg(s.refresh);
  }

  async function log(action, entity, id, meta) {
    const { data: { session } } = await sb().auth.getSession();
    await sb().from('marketplace_audit_log').insert({
      actor_user_id: session?.user?.id, action, entity, entity_id: id, meta: meta || null });
  }

  async function approveCompany(c) {
    await sb().from('marketplace_companies')
      .update({ status:'published', published_at: new Date().toISOString() }).eq('id', c.id);
    await sb().from('marketplace_company_images').update({ approved:true }).eq('company_id', c.id);
    await log('company.approve','company',c.id);
    await refreshPages(); await load();
  }
  async function rejectCompany(c) {
    await sb().from('marketplace_companies').update({ status:'draft' }).eq('id', c.id);
    await log('company.reject','company',c.id); await load();
  }
  async function setStatus(c, status) {
    await sb().from('marketplace_companies').update({ status }).eq('id', c.id);
    await log('company.status','company',c.id,{ status });
    await refreshPages(); await load();
  }
  async function toggleFounding(c) {
    await sb().from('marketplace_companies')
      .update({ founding_member: !c.founding_member }).eq('id', c.id);
    await refreshPages(); await load();
  }

  async function approveRevision(r) {
    const { category_ids, region_ids, ...fields } = r.payload || {};
    await sb().from('marketplace_companies').update(fields).eq('id', r.company_id);
    if (Array.isArray(category_ids)) {
      await sb().from('marketplace_company_categories').delete().eq('company_id', r.company_id);
      if (category_ids.length)
        await sb().from('marketplace_company_categories')
          .insert(category_ids.map(id => ({ company_id: r.company_id, category_id: id })));
    }
    if (Array.isArray(region_ids)) {
      await sb().from('marketplace_company_regions').delete().eq('company_id', r.company_id);
      if (region_ids.length)
        await sb().from('marketplace_company_regions')
          .insert(region_ids.map(id => ({ company_id: r.company_id, region_id: id })));
    }
    await sb().from('marketplace_company_images').update({ approved:true }).eq('company_id', r.company_id);
    await sb().from('marketplace_company_revisions')
      .update({ status:'approved', decided_at: new Date().toISOString() }).eq('id', r.id);
    await log('revision.approve','revision',r.id);
    await refreshPages(); await load();
  }
  async function rejectRevision(r) {
    await sb().from('marketplace_company_revisions')
      .update({ status:'rejected', decided_at: new Date().toISOString() }).eq('id', r.id);
    await log('revision.reject','revision',r.id); await load();
  }

  async function approveRef(r) {
    await sb().from('marketplace_references')
      .update({ status:'approved', decided_at: new Date().toISOString() }).eq('id', r.id);
    await log('reference.approve','reference',r.id);
    await refreshPages(); await load();
  }
  async function rejectRef(r) {
    await sb().from('marketplace_references')
      .update({ status:'rejected', decided_at: new Date().toISOString() }).eq('id', r.id);
    await load();
  }

  async function approveClaim(cl) {
    await sb().from('marketplace_companies')
      .update({ owner_user_id: cl.user_id, is_claimed: true }).eq('id', cl.company_id);
    await sb().from('marketplace_claim_requests')
      .update({ status:'approved', decided_at: new Date().toISOString() }).eq('id', cl.id);
    await log('claim.approve','claim',cl.id); await load();
  }

  async function assignSlot(e) {
    e.preventDefault(); setMsg('');
    const { region, category, company, until } = slotForm;
    if (!region || !category || !company || !until) return;
    const busy = slots.filter(x => x.region_id === region && x.category_id === category);
    if (busy.length >= 3) return setMsg(s.slotFull);
    await sb().from('marketplace_featured_slots').insert({
      region_id: region, category_id: category, company_id: company, ends_at: until });
    await log('slot.assign','slot',null,{ region, category, company });
    setSlotForm({ region:'', category:'', company:'', until:'' });
    await refreshPages(); await load();
  }
  async function removeSlot(id) {
    await sb().from('marketplace_featured_slots').update({ active:false }).eq('id', id);
    await refreshPages(); await load();
  }

  const nameOf = (id) => all.find(c => c.id === id)?.name || id?.slice(0,8);
  const regName = (id) => { const r = regs.find(x=>x.id===id); return r ? pick(lang, r.name_tr, r.name_en) : ''; };
  const catName = (id) => { const c = cats.find(x=>x.id===id); return c ? pick(lang, c.name_tr, c.name_en) : ''; };

  if (ok === null) return <div className="wrap"><p className="empty">…</p></div>;
  if (ok === false) return <div className="wrap"><p className="empty">{s.noAccess}</p></div>;

  return (
    <div className="wrap" style={{ padding:'28px 18px 80px', display:'grid', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:'1.3rem' }}>{s.title}</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn ghost" style={btnSm} onClick={refreshPages}>{s.refreshBtn}</button>
          <button className="btn ghost" style={btnSm}
            onClick={async ()=>{ await sb().auth.signOut(); router.replace(`/${lang}`); }}>{s.logout}</button>
        </div>
      </div>
      {msg && <p style={{ color:'#7fd7b0', fontSize:'.82rem' }}>{msg}</p>}

      <section className="panel">
        <h2>{s.queue} ({pending.length})</h2>
        {pending.length === 0 ? <p style={{ color:'var(--fog)', fontSize:'.86rem' }}>{s.empty}</p> :
          pending.map(c => (
            <div className="ref" key={c.id}>
              <b>{c.name}</b>
              <p>{c.phone} {c.email}</p>
              <p>{c.description_tr}</p>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn" style={btnSm} onClick={()=>approveCompany(c)}>{s.approve}</button>
                <button className="btn ghost" style={btnSm} onClick={()=>rejectCompany(c)}>{s.reject}</button>
              </div>
            </div>
          ))}
      </section>

      <section className="panel">
        <h2>{s.revisions} ({revs.length})</h2>
        {revs.length === 0 ? <p style={{ color:'var(--fog)', fontSize:'.86rem' }}>{s.empty}</p> :
          revs.map(r => (
            <div className="ref" key={r.id}>
              <b>{nameOf(r.company_id)}</b>
              <pre style={{ color:'var(--fog)', fontSize:'.74rem', whiteSpace:'pre-wrap', marginTop:6 }}>
                {JSON.stringify(r.payload, null, 1)}
              </pre>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn" style={btnSm} onClick={()=>approveRevision(r)}>{s.approve}</button>
                <button className="btn ghost" style={btnSm} onClick={()=>rejectRevision(r)}>{s.reject}</button>
              </div>
            </div>
          ))}
      </section>

      <section className="panel">
        <h2>{s.pendingRefs} ({pendingRefs.length})</h2>
        <p style={{ color:'var(--fog)', fontSize:'.76rem', marginBottom:10 }}>{s.approveRef}</p>
        {pendingRefs.length === 0 ? <p style={{ color:'var(--fog)', fontSize:'.86rem' }}>{s.empty}</p> :
          pendingRefs.map(r => (
            <div className="ref" key={r.id}>
              <b>{nameOf(r.company_id)} — {r.boat_name}</b>
              <p>{r.work_summary}</p>
              <p>{r.contact_email}</p>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn" style={btnSm} onClick={()=>approveRef(r)}>{s.approve}</button>
                <button className="btn ghost" style={btnSm} onClick={()=>rejectRef(r)}>{s.reject}</button>
              </div>
            </div>
          ))}
      </section>

      <section className="panel">
        <h2>{s.claims} ({claims.length})</h2>
        {claims.length === 0 ? <p style={{ color:'var(--fog)', fontSize:'.86rem' }}>{s.empty}</p> :
          claims.map(cl => (
            <div className="ref" key={cl.id}>
              <b>{nameOf(cl.company_id)}</b>
              <p>{cl.contact_email}</p>
              <button className="btn" style={{ ...btnSm, marginTop:8 }} onClick={()=>approveClaim(cl)}>{s.approve}</button>
            </div>
          ))}
      </section>

      <section className="panel">
        <h2>{s.featured}</h2>
        {slots.map(sl => (
          <div className="kv" key={sl.id}>
            <span>{regName(sl.region_id)} · {catName(sl.category_id)}</span>
            <span style={{ color:'var(--white)' }}>{nameOf(sl.company_id)}
              <button className="btn ghost" style={{ ...btnSm, marginLeft:10 }}
                onClick={()=>removeSlot(sl.id)}>{s.remove}</button>
            </span>
          </div>
        ))}
        <form onSubmit={assignSlot} style={{ marginTop:14 }}>
          <select style={inp} value={slotForm.region} onChange={e=>setSlotForm({...slotForm, region:e.target.value})}>
            <option value="">{s.region}</option>
            {regs.map(r => <option key={r.id} value={r.id}>{pick(lang, r.name_tr, r.name_en)}</option>)}
          </select>
          <select style={inp} value={slotForm.category} onChange={e=>setSlotForm({...slotForm, category:e.target.value})}>
            <option value="">{s.category}</option>
            {cats.map(c => <option key={c.id} value={c.id}>{pick(lang, c.name_tr, c.name_en)}</option>)}
          </select>
          <select style={inp} value={slotForm.company} onChange={e=>setSlotForm({...slotForm, company:e.target.value})}>
            <option value="">{s.company}</option>
            {all.filter(c=>c.status==='published').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={inp} type="date" value={slotForm.until}
            onChange={e=>setSlotForm({...slotForm, until:e.target.value})} />
          <button className="btn ghost">{s.assign}</button>
        </form>
      </section>

      <section className="panel">
        <h2>{s.companies} ({all.length})</h2>
        {all.map(c => (
          <div className="kv" key={c.id}>
            <span>{c.name} <em style={{ fontStyle:'normal', opacity:.7 }}>· {c.status}</em></span>
            <span style={{ display:'flex', gap:6 }}>
              <button className="btn ghost" style={btnSm} onClick={()=>toggleFounding(c)}>
                {c.founding_member ? '★' : '☆'}
              </button>
              {c.status !== 'published'
                ? <button className="btn ghost" style={btnSm} onClick={()=>setStatus(c,'published')}>{s.publish}</button>
                : <button className="btn ghost" style={btnSm} onClick={()=>setStatus(c,'suspended')}>{s.suspend}</button>}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
