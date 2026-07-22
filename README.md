# RefitPort — v1

Next.js 14 (App Router) + Supabase + ISR. Navy/beyaz kimlik, TR/EN.

## Sayfalar
| Adres | Ne yapar |
|---|---|
| `/tr` · `/en` | Ana sayfa, hizmet + bölge araması |
| `/tr/{bolge}/{kategori}` | Firma listesi — vitrin üstte, organik kalite sırasıyla |
| `/tr/firma/{slug}` · `/en/company/{slug}` | Firma profili, galeri, referanslar, iletişim formu |
| `/tr/giris` | Firma kaydı ve girişi |
| `/tr/panel` | Firma paneli: profil, görseller, referanslar, gelen talepler |
| `/tr/admin` | Admin paneli (yalnızca marketplace_admins tablosundaki kullanıcılar) |

## Kurulum (ilk kez)
1. Supabase (ayrı RefitPort projesi): `01_refitport_schema.sql` → `02_refitport_rls.sql`
2. GitHub'a bu klasörü yükle
3. Vercel → Import → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = https://refitport.com
4. Deploy

## Kendini admin yapma
1. `/tr/giris` → kendi e-postanla hesap oluştur (Supabase'den doğrulama maili gelir)
2. Supabase → Authentication → Users → kendi UUID'ni kopyala
3. SQL Editor: `insert into marketplace_admins (user_id) values ('UUID');`
4. `/tr/admin` artık açılır

## Akış
- Firma `/tr/giris`'ten kayıt olur → `/tr/panel`'de profilini doldurur → **Onaya gönder**
- Admin `/tr/admin` → Onay Kuyruğu → **Onayla** → profil yayına girer, sayfalar anında tazelenir
- Yayındaki firma profilini düzenlerse değişiklik **Değişiklik Onayları**'na düşer; eski sürüm yayında kalır
- Görseller yüklendiğinde `approved=false`; firma/revizyon onaylanınca otomatik onaylanır
- Referansı firma ekler → admin panelinden onaylanır (otomatik e-posta akışı henüz yok)

## Henüz yok
- Referans onay e-postası (Namecheap SMTP) — şu an admin manuel onaylıyor
- Claim akışı arayüzü (profildeki buton şimdilik e-posta açıyor)
- sitemap.xml / robots.txt
- Hukuki metinler (KVKK aydınlatma, kullanım şartları)


## Yeni ortam değişkenleri (v1.1)
Vercel → Settings → Environment Variables'a ekle (Production + Preview):

| Değişken | Değer | Not |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** | GİZLİ — `NEXT_PUBLIC_` YOK. Sadece mail API'leri kullanır. |
| `SMTP_HOST` | `mail.privateemail.com` | Namecheap Private Email |
| `SMTP_PORT` | `465` | |
| `SMTP_USER` | `noreply@refitport.com` | Namecheap'te bu mailbox'ı oluştur |
| `SMTP_PASS` | mailbox şifresi | |
| `SMTP_FROM` | `RefitPort <noreply@refitport.com>` | |

## v1.1 ile gelenler
- **SEO:** `/sitemap.xml` (tüm bölge+kategori ve firma sayfaları) + `/robots.txt` (panel/admin/api gizli)
- **Admin → Sayfaları Tazele** butonu: SQL'le toplu iş sonrası önbelleği tek tıkla tazeler
- **Referans onay maili:** firma referans ekleyince kaptana token'lı mail → `/tr/referans?token=...` → onay/red + adıyla/anonim seçimi
- **Lead bildirimi:** yeni talep firmanın e-postasına düşer
- **Claim akışı:** profildeki "Sahiplenin" → giriş → talep → admin onayı → profil devri

## Namecheap SMTP notu
Private Email hesabında `noreply@refitport.com` mailbox'ı açman gerekir (Namecheap → Private Email).
Alternatif olarak mevcut `superyachtapps.com` SMTP'sini de kullanabilirsin; o zaman SMTP_* değerlerini
ona göre gir ve SMTP_FROM'u o adrese ayarla.
