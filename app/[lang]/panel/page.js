'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../../lib/supabaseBrowser';
import { slugify } from '../../../lib/slug';
import { pick } from '../../../lib/i18n';

const L = {
  tr: {
    panel:'Firma Paneli', logout:'Çıkış', create:'Firma Profili Oluştur',
    name:'Firma adı', phone:'Telefon', email:'E-posta', website:'Web sitesi',
    whatsapp:'WhatsApp', sub:'Marina / çekek yeri (opsiyonel)',
    dtr:'Açıklama (Türkçe)', den:'Açıklama (İngilizce)',
    cats:'Hizmet kategorileri', regs:'Hizmet bölgeleri',
    save:'Kaydet', submit:'Onaya gönder', saved:'Kaydedildi.',
    pendingInfo:'Profiliniz onay bekliyor. Onaylandığında yayına alınacak.',
    publishedInfo:'Profiliniz yayında. Yaptığınız değişiklikler onaydan sonra yansır.',
    draftInfo:'Taslak halinde. Tamamlayıp onaya gönderin.',
    revisionSent:'Değişiklikleriniz onaya gönderildi.',
    images:'Görseller', upload:'Görsel yükle', imgPending:'onay bekliyor',
    leads:'Gelen Talepler', noLeads:'Henüz talep yok.',
    refs:'Referanslar', refBoat:'Tekne adı', refEmail:'Kaptan / şirket e-postası',
    refWork:'Yapılan iş', refAdd:'Referans ekle',
    refNote:'Referans, kaptanın e-posta onayından sonra profilinizde görünür.',
    refPending:'onay bekliyor', refApproved:'onaylı', refRejected:'reddedildi',
    status:'Durum', required:'Firma adı, telefon ve en az bir kategori/bölge gerekli.',
    viewProfile:'Profili gör',
  },
  en: {
    panel:'Company Panel', logout:'Sign out', create:'Create Company Profile',
    name:'Company name', phone:'Phone', email:'Email', website:'Website',
    whatsapp:'WhatsApp', sub:'Marina / boatyard (optional)',
    dtr:'Description (Turkish)', den:'Description (English)',
    cats:'Service categories', regs:'Service areas',
    save:'Save', submit:'Submit for approval', saved:'Saved.',
    pendingInfo:'Your profile is awaiting approval.',
    publishedInfo:'Your profile is live. Changes appear after approval.',
    draftInfo:'Draft. Complete it and submit for approval.',
    revisionSent:'Your changes have been submitted for approval.',
    images:'Images', upload:'Upload image', imgPending:'pending approval',
    leads:'Incoming Requests', noLeads:'No requests yet.',
    refs:'References', refBoat:'Boat name', refEmail:'Captain / company email',
    refWork:'Work carried out', refAdd:'Add reference',
    refNote:'A reference appears on your profile after the captain confirms by email.',
    refPending:'pending', refApproved:'approved', refRejected:'rejected',
    status:'Status', required:'Company name, phone and at least one category/region are required.',
    viewProfile:'View profile',
  },
};

const inp = { width:'100%', height:44, background:'var(--navy-soft)', color:'var(--white)',
  border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:10, fontSize:'.9rem' };
const area = { ...inp, height:100, padding:'10px 12px' };

export default function Panel({ params }) {
  const { lang } = params;
  const s = L[lang] || L.tr;
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [cats, setCats] = useState([]);
  const [regs, setRegs] = useState([]);
  const [myCats, setMyCats] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [images, setImages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [refs, setRefs] = useState([]);
  const [form, setForm] = useState({ name:'', phone:'', email:'', website:'', whatsapp:'',
    sub_location:'', description_tr:'', description_en:'' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await sb().auth.getSession();
    if (!session) { router.replace(`/${lang}/giris`); return; }
    setUser(session.user);

    const [{ data: cs }, { data: rs }] = await Promise.all([
      sb().from('marketplace_categories').select('*').eq('active', true).order('sort_order'),
      sb().from('marketplace_regions').select('*').eq('active', true).order('sort_order'),
    ]);
    setCats(cs || []); setRegs(rs || []);

    const { data: co } = await sb().from('marketplace_companies').select('*')
      .eq('owner_user_id', session.user.id).maybeSingle();

    if (co) {
      setCompany(co);
      setForm({
        name: co.name || '', phone: co.phone || '', email: co.email || '',
        website: co.website || '', whatsapp: co.whatsapp || '',
        sub_location: co.sub_location || '',
        description_tr: co.description_tr || '', description_en: co.description_en || '',
      });
      const [{ data: cc }, { data: cr }, { data: im }, { data: ld }, { data: rf }] = await Promise.all([
        sb().from('marketplace_company_categories').select('category_id').eq('company_id', co.id),
        sb().from('marketplace_company_regions').select('region_id').eq('company_id', co.id),
        sb().from('marketplace_company_images').select('*').eq('company_id', co.id).order('sort_order'),
        sb().from('marketplace_leads').select('*').eq('company_id', co.id).order('created_at', { ascending:false }),
        sb().from('marketplace_references').select('*').eq('company_id', co.id).order('requested_at', { ascending:false }),
      ]);
      setMyCats((cc || []).map(x => x.category_id));
      setMyRegs((cr || []).map(x => x.region_id));
      setImages(im || []); setLeads(ld || []); setRefs(rf || []);
    }
    setLoading(false);
  }, [lang, router]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (arr, setArr, id) =>
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  async function save() {
    setMsg('');
    if (!form.name || !form.phone) return setMsg(s.required);
    if (!myCats.length || !myRegs.length) return setMsg(s.required);

    if (!company) {
      const baseSlug = slugify(form.name) || 'firma';
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        website: form.website || null,
        whatsapp: form.whatsapp || null,
        sub_location: form.sub_location || null,
        description_tr: form.description_tr || null,
        description_en: form.description_en || null,
        slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
        owner_user_id: user.id,
        status: 'draft',
        is_claimed: true,
      };
      const { data, error } = await sb().from('marketplace_companies')
        .insert(payload).select().single();
      if (error) { setMsg('Kayıt hatası: ' + error.message); return; }
      const linkErr = await syncLinks(data.id);
      if (linkErr) { setMsg('Bağlantı hatası: ' + linkErr); return; }
      setCompany(data); setMsg(s.saved);
      return;
    }

    if (company.status === 'published') {
      const { error } = await sb().from('marketplace_company_revisions').insert({
        company_id: company.id,
        payload: { ...form, category_ids: myCats, region_ids: myRegs },
      });
      return setMsg(error ? error.message : s.revisionSent);
    }

    const { error } = await sb().from('marketplace_companies').update(form).eq('id', company.id);
    if (error) return setMsg(error.message);
    await syncLinks(company.id);
    setMsg(s.saved);
  }

  async function syncLinks(companyId) {
    await sb().from('marketplace_company_categories').delete().eq('company_id', companyId);
    await sb().from('marketplace_company_regions').delete().eq('company_id', companyId);
    if (myCats.length) {
      const { error } = await sb().from('marketplace_company_categories')
        .insert(myCats.map(id => ({ company_id: companyId, category_id: id })));
      if (error) return error.message;
    }
    if (myRegs.length) {
      const { error } = await sb().from('marketplace_company_regions')
        .insert(myRegs.map(id => ({ company_id: companyId, region_id: id })));
      if (error) return error.message;
    }
    return null;
  }

  async function submitForApproval() {
    const { error } = await sb().from('marketplace_companies')
      .update({ status: 'pending' }).eq('id', company.id);
    if (!error) { setCompany({ ...company, status: 'pending' }); setMsg(s.saved); }
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    const path = `${company.id}/${Date.now()}-${slugify(file.name)}`;
    const { error } = await sb().storage.from('marketplace').upload(path, file);
    if (error) return setMsg(error.message);
    const { data: pub } = sb().storage.from('marketplace').getPublicUrl(path);
    const { data: row } = await sb().from('marketplace_company_images')
      .insert({ company_id: company.id, url: pub.publicUrl }).select().single();
    if (row) setImages([...images, row]);
  }

  async function addReference(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { data, error } = await sb().from('marketplace_references').insert({
      company_id: company.id,
      boat_name: f.get('boat'), contact_email: f.get('email'), work_summary: f.get('work'),
    }).select().single();
    if (error) return setMsg(error.message);
    // kaptana onay daveti maili gönder (best-effort)
    fetch('/api/reference', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceId: data.id }),
    }).catch(() => {});
    setRefs([data, ...refs]); e.target.reset();
  }

  if (loading) return <div className="wrap"><p className="empty">…</p></div>;

  const statusInfo = company
    ? (company.status === 'published' ? s.publishedInfo
      : company.status === 'pending' ? s.pendingInfo : s.draftInfo)
    : null;

  return (
    <div className="wrap" style={{ padding:'28px 18px 80px', display:'grid', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:'1.3rem' }}>{s.panel}</h1>
        <button className="btn ghost" style={{ width:'auto', padding:'10px 16px' }}
          onClick={async ()=>{ await sb().auth.signOut(); router.replace(`/${lang}`); }}>{s.logout}</button>
      </div>

      {statusInfo && (
        <div className="panel" style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
          <p style={{ fontSize:'.86rem', color:'var(--fog)' }}>{statusInfo}</p>
          {company.status === 'draft' && (
            <button className="btn" style={{ width:'auto', padding:'10px 16px' }}
              onClick={submitForApproval}>{s.submit}</button>
          )}
          {company.status === 'published' && (
            <a className="btn ghost" style={{ width:'auto', padding:'10px 16px' }}
              href={`/${lang}/${lang==='tr'?'firma':'company'}/${company.slug}`}>{s.viewProfile}</a>
          )}
        </div>
      )}

      <section className="panel">
        <h2>{company ? s.panel : s.create}</h2>
        <input style={inp} placeholder={s.name} value={form.name} onChange={set('name')} />
        <input style={inp} placeholder={s.phone} value={form.phone} onChange={set('phone')} />
        <input style={inp} placeholder={s.email} value={form.email} onChange={set('email')} />
        <input style={inp} placeholder={s.website} value={form.website} onChange={set('website')} />
        <input style={inp} placeholder={s.whatsapp} value={form.whatsapp} onChange={set('whatsapp')} />
        <input style={inp} placeholder={s.sub} value={form.sub_location} onChange={set('sub_location')} />
        <textarea style={area} placeholder={s.dtr} value={form.description_tr} onChange={set('description_tr')} />
        <textarea style={area} placeholder={s.den} value={form.description_en} onChange={set('description_en')} />

        <h2 style={{ marginTop:14 }}>{s.cats}</h2>
        <div className="chips">
          {cats.map(c => (
            <button key={c.id} type="button" className="chip"
              style={myCats.includes(c.id) ? { background:'var(--white)', color:'var(--navy)', borderColor:'var(--white)' } : {}}
              onClick={()=>toggle(myCats, setMyCats, c.id)}>
              {pick(lang, c.name_tr, c.name_en)}
            </button>
          ))}
        </div>

        <h2 style={{ marginTop:14 }}>{s.regs}</h2>
        <div className="chips">
          {regs.map(r => (
            <button key={r.id} type="button" className="chip"
              style={myRegs.includes(r.id) ? { background:'var(--white)', color:'var(--navy)', borderColor:'var(--white)' } : {}}
              onClick={()=>toggle(myRegs, setMyRegs, r.id)}>
              {pick(lang, r.name_tr, r.name_en)}
            </button>
          ))}
        </div>

        <button className="btn" style={{ marginTop:16 }} onClick={save}>{s.save}</button>
        {msg && <p style={{ color:'var(--fog)', fontSize:'.82rem', marginTop:10 }}>{msg}</p>}
      </section>

      {company && (
        <>
          <section className="panel">
            <h2>{s.images}</h2>
            <div className="gallery">
              {images.map(im => (
                <div key={im.id} style={{ position:'relative' }}>
                  <img src={im.url} alt="" />
                  {!im.approved && (
                    <span className="badge" style={{ position:'absolute', bottom:6, left:6, background:'var(--navy)' }}>
                      {s.imgPending}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <label className="btn ghost" style={{ marginTop:12, display:'block', cursor:'pointer' }}>
              {s.upload}
              <input type="file" accept="image/*" onChange={uploadImage} style={{ display:'none' }} />
            </label>
          </section>

          <section className="panel">
            <h2>{s.refs}</h2>
            <p style={{ color:'var(--fog)', fontSize:'.78rem', marginBottom:12 }}>{s.refNote}</p>
            {refs.map(r => (
              <div className="ref" key={r.id}>
                <b>{r.boat_name}</b>
                <p>{r.work_summary}</p>
                <span className="badge" style={{ marginTop:6, display:'inline-block' }}>
                  {r.status === 'approved' ? s.refApproved : r.status === 'rejected' ? s.refRejected : s.refPending}
                </span>
              </div>
            ))}
            <form onSubmit={addReference} style={{ marginTop:14 }}>
              <input style={inp} name="boat" placeholder={s.refBoat} required />
              <input style={inp} name="email" type="email" placeholder={s.refEmail} required />
              <textarea style={area} name="work" placeholder={s.refWork} required />
              <button className="btn ghost">{s.refAdd}</button>
            </form>
          </section>

          <section className="panel">
            <h2>{s.leads}</h2>
            {leads.length === 0 ? <p style={{ color:'var(--fog)', fontSize:'.86rem' }}>{s.noLeads}</p> :
              leads.map(l => (
                <div className="ref" key={l.id}>
                  <b>{l.name}</b>
                  <p style={{ color:'var(--white)' }}>{l.message}</p>
                  <p>{l.email}{l.phone ? ` · ${l.phone}` : ''}{l.boat_name ? ` · ${l.boat_name}` : ''}</p>
                  <p>{new Date(l.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB')}
                    {l.date_from ? ` · ${l.date_from} → ${l.date_to || ''}` : ''}</p>
                </div>
              ))}
          </section>
        </>
      )}
    </div>
  );
}
