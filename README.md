# RefitPort — v1 İskelet

Next.js 14 (App Router) + Supabase + ISR. Navy/beyaz kimlik, TR/EN.

## 1. Supabase hazırlığı
Ayrı RefitPort projesinde `01_refitport_schema.sql` ve `02_refitport_rls.sql` çalıştırılmış olmalı.

## 2. GitHub'a yükleme
1. GitHub'da yeni repo: **refitport** (Private)
2. "uploading an existing file" → bu klasördeki TÜM dosyaları sürükle
   (node_modules ve .next YOK — zaten pakette de yok)
3. Commit.

## 3. Vercel bağlantısı
1. vercel.com → Add New → Project → refitport reposunu seç
2. Framework: Next.js (otomatik algılar) → Deploy'a **basmadan önce** Environment Variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL` → Supabase → Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → aynı sayfadaki **anon public** anahtar
   - `NEXT_PUBLIC_SITE_URL` → https://refitport.com
3. Deploy.

## 4. Domain
Vercel → Project → Settings → Domains → `refitport.com` ekle.
Namecheap'te DNS kayıtlarını Vercel'in gösterdiği şekilde gir.
`refitbay.com`'u da ekleyip refitport.com'a **redirect** olarak ayarla.

## Sayfalar
- `/tr` · `/en` — arama (hizmet + bölge)
- `/tr/{bolge}/{kategori}` — liste; vitrin üstte, organik kalite sırasıyla
- `/tr/firma/{slug}` · `/en/company/{slug}` — firma profili, galeri, referanslar, iletişim formu

## Henüz yok (sıradaki adımlar)
- Firma kaydı + giriş (auth)
- Admin onay paneli
- Referans onay maili akışı (Namecheap SMTP)
- sitemap.xml / robots.txt

## Yerelde çalıştırma (opsiyonel)
```
npm install
cp .env.example .env.local   # ve değerleri doldur
npm run dev
```
