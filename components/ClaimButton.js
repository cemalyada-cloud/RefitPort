'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../lib/supabaseBrowser';

const L = {
  tr: {
    claim:'Profili sahiplenin', sending:'Gönderiliyor…',
    sent:'Talebiniz alındı. Onaylandığında profili panelinizden yönetebileceksiniz.',
    loginFirst:'Sahiplenmek için önce giriş yapın / hesap oluşturun.',
    already:'Bu profil için zaten bir talebiniz var.',
    email:'İletişim e-postanız', note:'Kısa not (opsiyonel)', submit:'Talep gönder',
  },
  en: {
    claim:'Claim this profile', sending:'Sending…',
    sent:'Request received. Once approved you can manage this profile from your panel.',
    loginFirst:'Please sign in / create an account to claim.',
    already:'You already have a request for this profile.',
    email:'Your contact email', note:'Short note (optional)', submit:'Send request',
  },
};

export default function ClaimButton({ lang, companyId }) {
  const s = L[lang] || L.tr;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState('idle');

  async function start() {
    const { data: { session } } = await sb().auth.getSession();
    if (!session) { router.push(`/${lang}/giris`); return; }
    setEmail(session.user.email || '');
    setOpen(true);
  }

  async function submit() {
    setState('sending');
    const { data: { session } } = await sb().auth.getSession();
    const { error } = await sb().from('marketplace_claim_requests').insert({
      company_id: companyId, user_id: session.user.id,
      contact_email: email, note: note || null,
    });
    setState(error ? 'idle' : 'sent');
  }

  if (state === 'sent')
    return <p style={{ color:'#7fd7b0', fontSize:'.86rem' }}>{s.sent}</p>;

  if (!open)
    return <button className="btn ghost" onClick={start}>{s.claim}</button>;

  const inp = { width:'100%', height:42, background:'var(--navy-soft)', color:'var(--white)',
    border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:8, fontSize:'.88rem' };

  return (
    <div>
      <input style={inp} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={s.email} />
      <textarea style={{ ...inp, height:70, padding:'10px 12px' }} value={note}
        onChange={(e)=>setNote(e.target.value)} placeholder={s.note} />
      <button className="btn" onClick={submit} disabled={state==='sending'}>
        {state==='sending' ? s.sending : s.submit}
      </button>
    </div>
  );
}
