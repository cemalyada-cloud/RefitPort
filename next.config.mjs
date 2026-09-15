// ── MC HÜKMÜ (TUR 132): sır kapısının BAĞI da bir kapının paydasında olmalı ──
// Öz-denetim her `next build`'te (config yüklenirken) koşar; postbuild sir-kapisi
// bağı yoksa build DÜŞER. Kutuplandı (kural 126): bağ var→geçer, yok→düşer.
// NOT: makbuz her config YÜKLEMESİNDE basar (Next sürümüne göre yapı başına 1–N kez;
// ayrı süreçler). Bir yapı-günlüğü ŞERHİDİR, sayılan bir ölçüt değil — "tek sefer"
// İDDİA EDİLMEZ (süreçler-arası tekillik kırılgan; kural 112: aynı ad, iki davranış).
import { readFileSync as __rfs } from 'node:fs';
{
  const __pb = (() => { try { return JSON.parse(__rfs(new URL('./package.json', import.meta.url))).scripts?.postbuild || ''; } catch { return ''; } })();
  if (!/sir-kapisi/.test(__pb)) {
    throw new Error('🔴 ÖZ-DENETİM (MC TUR 132): package.json scripts.postbuild sir-kapisi çağrısını içermiyor — sır kapısı bağı KOPMUŞ, build DURDURULDU.');
  }
  console.log('sir-kapisi zinciri: sir-kapisi ← postbuild (öz-denetim ✔) ← npm lifecycle ← buildCommand');
  console.log('  ⚠ son halka (buildCommand): PROJE AYARI · depoda iz yok · ÖLÇÜLMEDİ');
  console.log('  ⚠ son halkanın tanığı: yapı günlüğündeki kapı kimlik satırı — OKUYAN: Mission Control (alet değil KİŞİ)');
  console.log('  ⚠ TAVAN: next.config.mjs silinirse ölçüm yok olur, build yine geçer — künye/manifest gerekir (emsal: Bridge PAKET.json)');
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
