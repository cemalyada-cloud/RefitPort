// ── MC HÜKMÜ (TUR 132): sır kapısının BAĞI da bir kapının paydasında olmalı ──
// Bu öz-denetim her `next build`'te (config yüklenirken) koşar; sır kapısının
// package.json postbuild bağı yoksa build DÜŞER. Böylece bağı silmek sessiz kalmaz.
import { readFileSync as __rfs } from 'node:fs';
{
  const __pb = (() => { try { return JSON.parse(__rfs(new URL('./package.json', import.meta.url))).scripts?.postbuild || ''; } catch { return ''; } })();
  console.log('sir-kapisi bağı: package.json postbuild ← next.config.mjs öz-denetimi');
  console.log('⚠ TAVAN: next.config.mjs SİLİNİRSE bu ölçüm yok olur ve yapı YİNE DE geçer — tam kapanış künye/manifest ister (emsal: Bridge PAKET.json).');
  if (!/sir-kapisi/.test(__pb)) {
    throw new Error('🔴 ÖZ-DENETİM (MC TUR 132): package.json scripts.postbuild sir-kapisi çağrısını içermiyor — sır kapısı bağı KOPMUŞ, build DURDURULDU.');
  }
  console.log('  öz-denetim: sır kapısı bağı package.json postbuild\'te ✔');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // SEO: Türkçe URL'ler ayrı görünür, aynı sayfaya bağlanır
      { source: '/tr/firma/:slug', destination: '/tr/company/:slug' },
    ];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
};
export default nextConfig;
