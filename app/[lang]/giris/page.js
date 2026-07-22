'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../../lib/supabaseBrowser';

const L = {
  tr: { title:'Firma Girişi', sub:'Hesabınızla giriş yapın veya yeni firma hesabı oluşturun.',
        email:'E-posta', pass:'Şifre', login:'Giriş yap', signup:'Hesap oluştur',
        toSignup:'Hesabınız yok mu? Kayıt olun', toLogin:'Zaten hesabınız var mı? Giriş yapın',
        check:'E-postanıza doğrulama bağlantısı gönderildi. Onayladıktan sonra giriş yapabilirsiniz.',
        err:'Giriş başarısız. Bilgilerinizi kontrol edin.' },
  en: { title:'Company Login', sub:'Sign in or create a new company account.',
        email:'Email', pass:'Password', login:'Sign in', signup:'Create account',
        toSignup:"Don't have an account? Sign up", toLogin:'Already have an account? Sign in',
        check:'A confirmation link has been sent to your email. Sign in after confirming.',
        err:'Sign in failed. Please check your details.' },
};

export default function Login({ params }) {
  const { lang } = params;
  const s = L[lang] || L.tr;
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(`/${lang}/panel`);
    });
  }, [lang, router]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    if (mode === 'login') {
      const { error } = await sb().auth.signInWithPassword({ email, password: pass });
      setBusy(false);
      if (error) return setMsg(s.err);
      router.replace(`/${lang}/panel`);
    } else {
      const { error } = await sb().auth.signUp({ email, password: pass });
      setBusy(false);
      setMsg(error ? s.err : s.check);
    }
  }

  const inp = { width:'100%', height:46, background:'var(--navy-soft)', color:'var(--white)',
    border:'1px solid var(--line)', borderRadius:10, padding:'0 12px', marginBottom:10, fontSize:'.92rem' };

  return (
    <div className="wrap" style={{ maxWidth: 420, padding: '48px 18px 80px' }}>
      <h1 style={{ fontSize:'1.4rem', marginBottom:6 }}>{s.title}</h1>
      <p style={{ color:'var(--fog)', fontSize:'.86rem', marginBottom:20 }}>{s.sub}</p>
      <form onSubmit={submit} className="panel">
        <input style={inp} type="email" placeholder={s.email} value={email}
          onChange={(e)=>setEmail(e.target.value)} required />
        <input style={inp} type="password" placeholder={s.pass} value={pass}
          onChange={(e)=>setPass(e.target.value)} required minLength={6} />
        <button className="btn" disabled={busy}>{mode==='login' ? s.login : s.signup}</button>
        {msg && <p style={{ color:'var(--fog)', fontSize:'.8rem', marginTop:12 }}>{msg}</p>}
      </form>
      <button className="btn ghost" style={{ marginTop:12 }}
        onClick={()=>{ setMode(mode==='login'?'signup':'login'); setMsg(''); }}>
        {mode==='login' ? s.toSignup : s.toLogin}
      </button>
    </div>
  );
}
