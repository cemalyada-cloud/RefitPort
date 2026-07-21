'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { t } from '../lib/i18n';

const L = {
  tr: { name:'Ad Soyad', email:'E-posta', phone:'Telefon', boat:'Tekne adı / tipi',
        msg:'Mesajınız', from:'Başlangıç', to:'Bitiş', send:'Gönder',
        ok:'Talebiniz firmaya iletildi. Teşekkürler!',
        err:'Bir hata oluştu, lütfen tekrar deneyin.',
        note:'Bilgileriniz yalnızca bu firmaya iletilir.' },
  en: { name:'Full name', email:'Email', phone:'Phone', boat:'Boat name / type',
        msg:'Your message', from:'From', to:'To', send:'Send',
        ok:'Your request has been sent to the company. Thank you!',
        err:'Something went wrong, please try again.',
        note:'Your details are shared only with this company.' },
};

export default function LeadForm({ lang, companyId }) {
  const [f, setF] = useState({ name:'', email:'', phone:'', boat:'', message:'', from:'', to:'' });
  const [state, setState] = useState('idle');
  const [hp, setHp] = useState(''); // honeypot
  const s = L[lang];

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (hp) return; // bot
    setState('sending');
    const { error } = await supabase.from('marketplace_leads').insert({
      company_id: companyId,
      name: f.name, email: f.email, phone: f.phone || null,
      boat_name: f.boat || null, message: f.message,
      date_from: f.from || null, date_to: f.to || null,
    });
    setState(error ? 'error' : 'sent');
  }

  if (state === 'sent') return <p style={{ color:'#7fd7b0', fontSize:'.9rem' }}>{s.ok}</p>;

  const inp = { width:'100%', height:44, background:'var(--navy-soft)', color:'var(--white)',
    border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:8, fontSize:'.9rem' };

  return (
    <form onSubmit={submit}>
      <input style={inp} placeholder={s.name} value={f.name} onChange={set('name')} required />
      <input style={inp} type="email" placeholder={s.email} value={f.email} onChange={set('email')} required />
      <input style={inp} placeholder={s.phone} value={f.phone} onChange={set('phone')} />
      <input style={inp} placeholder={s.boat} value={f.boat} onChange={set('boat')} />
      <div style={{ display:'flex', gap:8 }}>
        <input style={inp} type="date" aria-label={s.from} value={f.from} onChange={set('from')} />
        <input style={inp} type="date" aria-label={s.to} value={f.to} onChange={set('to')} />
      </div>
      <textarea style={{ ...inp, height:96, padding:'10px 12px' }} placeholder={s.msg}
        value={f.message} onChange={set('message')} required />
      <input value={hp} onChange={(e)=>setHp(e.target.value)} tabIndex={-1}
        autoComplete="off" style={{ position:'absolute', left:'-9999px' }} aria-hidden="true" />
      <button className="btn" type="submit" disabled={state==='sending'}>
        {state === 'sending' ? '…' : s.send}
      </button>
      {state === 'error' && <p style={{ color:'#ff9b9b', fontSize:'.8rem', marginTop:8 }}>{s.err}</p>}
      <p style={{ color:'var(--fog)', fontSize:'.72rem', marginTop:10 }}>{s.note}</p>
    </form>
  );
}
