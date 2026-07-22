'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sb } from '../../../lib/supabaseBrowser';

const L = {
  tr: {
    title:'Referans Onayı', loading:'Yükleniyor…',
    invalid:'Bağlantı geçersiz veya süresi dolmuş.',
    already:'Bu referans için karar zaten verilmiş.',
    company:'Firma', boat:'Tekne', work:'Yapılan iş',
    q:'Bu referansı onaylıyor musunuz?',
    showName:'Tekne adım görünsün', anon:'Anonim görünsün',
    anonLabel:'Görünecek etiket (örn. 16m yelkenli)',
    approve:'Onayla', reject:'Reddet',
    approved:'Teşekkürler! Referans onaylandı ve firmanın profilinde görünecek.',
    rejected:'Referans reddedildi. Yayınlanmayacak.',
  },
  en: {
    title:'Reference Approval', loading:'Loading…',
    invalid:'This link is invalid or has expired.',
    already:'A decision has already been made for this reference.',
    company:'Company', boat:'Boat', work:'Work carried out',
    q:'Do you approve this reference?',
    showName:'Show my boat name', anon:'Show anonymously',
    anonLabel:'Label to display (e.g. 16m sailing yacht)',
    approve:'Approve', reject:'Reject',
    approved:'Thank you! The reference is approved and will appear on the profile.',
    rejected:'The reference has been rejected. It will not be published.',
  },
};

function Inner({ lang }) {
  const s = L[lang] || L.tr;
  const params = useSearchParams();
  const token = params.get('token');
  const [ref, setRef] = useState(null);
  const [state, setState] = useState('loading');
  const [mode, setMode] = useState('named');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    sb().from('marketplace_references').select('*, marketplace_companies(name)')
      .eq('token', token).maybeSingle().then(({ data }) => {
        if (!data) { setState('invalid'); return; }
        if (data.status !== 'pending') { setState('already'); return; }
        if (new Date(data.expires_at) < new Date()) { setState('invalid'); return; }
        setRef(data); setState('ready');
      });
  }, [token]);

  async function decide(decision) {
    setState('sending');
    const res = await fetch('/api/reference', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, decision, displayMode: mode, displayLabel: label }),
    });
    const j = await res.json();
    setState(j.ok ? (decision === 'approved' ? 'approved' : 'rejected') : 'invalid');
  }

  const box = { maxWidth: 480, margin: '0 auto', padding: '48px 18px 80px' };

  if (state === 'loading' || state === 'sending')
    return <div style={box}><p className="empty">{s.loading}</p></div>;
  if (state === 'invalid')
    return <div style={box}><div className="panel"><p>{s.invalid}</p></div></div>;
  if (state === 'already')
    return <div style={box}><div className="panel"><p>{s.already}</p></div></div>;
  if (state === 'approved')
    return <div style={box}><div className="panel"><p style={{color:'#7fd7b0'}}>{s.approved}</p></div></div>;
  if (state === 'rejected')
    return <div style={box}><div className="panel"><p>{s.rejected}</p></div></div>;

  return (
    <div style={box}>
      <h1 style={{ fontSize:'1.4rem', marginBottom:16 }}>{s.title}</h1>
      <div className="panel">
        <div className="kv"><span>{s.company}</span><b>{ref.marketplace_companies?.name}</b></div>
        <div className="kv"><span>{s.boat}</span><b>{ref.boat_name}</b></div>
        <div style={{ padding:'12px 0' }}>
          <span style={{ color:'var(--fog)', fontSize:'.82rem' }}>{s.work}</span>
          <p style={{ marginTop:4 }}>{ref.work_summary}</p>
        </div>

        <p style={{ marginTop:12, marginBottom:10, fontWeight:600 }}>{s.q}</p>
        <label style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, fontSize:'.9rem' }}>
          <input type="radio" name="m" checked={mode==='named'} onChange={()=>setMode('named')} /> {s.showName}
        </label>
        <label style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, fontSize:'.9rem' }}>
          <input type="radio" name="m" checked={mode==='anonymous'} onChange={()=>setMode('anonymous')} /> {s.anon}
        </label>
        {mode==='anonymous' && (
          <input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder={s.anonLabel}
            style={{ width:'100%', height:42, background:'var(--navy-soft)', color:'var(--white)',
              border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:10, fontSize:'.9rem' }} />
        )}

        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button className="btn" onClick={()=>decide('approved')}>{s.approve}</button>
          <button className="btn ghost" onClick={()=>decide('rejected')}>{s.reject}</button>
        </div>
      </div>
    </div>
  );
}

export default function ReferencePage({ params }) {
  return (
    <Suspense fallback={<div className="wrap"><p className="empty">…</p></div>}>
      <Inner lang={params.lang} />
    </Suspense>
  );
}
