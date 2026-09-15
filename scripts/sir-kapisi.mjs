#!/usr/bin/env node
// sir-kapisi.mjs — içerik-tabanlı sır kapısı (derleme kapısı, yorum değil)
// KURAL: bir ad bir beyandır; kapı ADA değil İÇERİĞE bakar — JWT'nin role iddiasını çözer.
//
// KAPSAM (davranışta): yalnız TARAYICIYA İNEN dosyalar — .next/static · dist · build · public · kaynak.
//   SUNUCU çıktısı (.next/server, .next/cache) HARİÇ: orada service_role NORMALDİR (doğru katman).
//   ⚠ TAVAN: SSR/dinamik ağırlıklı üründe .next/static tarayıcının aldığının yalnız bir DİLİMİDİR;
//     yanıt katmanı (SSR HTML/RSC) bu kapının GÖREMEDİĞİ yerdir — kapsam ürüne göre payda↔dilim değişir.
//
// ATEŞLEME KANITI (kural 126): JWT:0 tek başına "bulunacak yok" ile "yanlış yere bakıldı"yı ayıramaz.
//   Kapı, gerçek kökün altına sentetik anon yem yazar, yakalar, siler. Yakalayamazsa ölçüm GEÇERSİZ (exit 3).
//
// SIR HİJYENİ: token ASLA basılmaz — yalnız role + ref parmak izi + adres.
// Çıkış: 0 = tarandı+ateşleme kanıtlı, service_role YOK · 1 = service_role BULUNDU · 3 = ÖLÇÜLEMEDİ
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TOOL = 'sir-kapisi', VER = '1.2.0';
const EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.css','.map','.txt','.env']);
const JWT = /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;
const SKIP = /(^|\/)(node_modules|\.git)(\/|$)|\.next\/(server|cache|types)(\/|$)|(^|\/)server(\/|$)/;
const ROOTS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['src','app','components','lib','pages','dist','build','.next/static','assets','public','index.html'];

function* walk(p) {
  if (SKIP.test(p)) return;
  let st; try { st = statSync(p); } catch { return; }
  if (st.isDirectory()) { for (const e of readdirSync(p)) yield* walk(join(p, e)); }
  else if (EXT.has(p.slice(p.lastIndexOf('.')))) yield p;
}
function role(jwt) {
  try {
    let s = jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    s += '='.repeat((4 - s.length % 4) % 4);
    const p = JSON.parse(Buffer.from(s, 'base64').toString('utf8'));
    return { role: p.role ?? '?', ref: p.ref ?? '?' };
  } catch { return null; }
}
function b64u(o){ return Buffer.from(JSON.stringify(o)).toString('base64url'); }

let scanned = 0, bytes = 0, jwtCount = 0; const crit = [], seen = [], uniq = new Set();
const present = ROOTS.filter(existsSync);
for (const root of present) for (const f of walk(root)) {
  let txt; try { txt = readFileSync(f, 'utf8'); } catch { continue; }
  scanned++; bytes += Buffer.byteLength(txt);
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) for (const m of (lines[i].match(JWT) || [])) {
    jwtCount++; uniq.add(m);
    const r = role(m);
    if (!r) { seen.push(`${f}:${i+1} · JWT çözülemedi`); continue; }
    const rec = `${f}:${i+1} · role=${r.role} · ref=${r.ref}`;
    if (r.role === 'service_role') crit.push(rec); else seen.push(`${rec} · ${r.role==='anon'?'anon-ok':r.role}`);
  }
}

// ATEŞLEME KANITI — yem gerçek tarama kökünün (tercihen build çıktısı) altına yazılır, taranır, silinir
let fireProof = null, probeDir = null;
try {
  const dirRoots = present.filter(r => { try { return statSync(r).isDirectory(); } catch { return false; } });
  const probeRoot = dirRoots.find(r => /static|dist|build/.test(r)) || dirRoots[0] || null;
  if (probeRoot) {
    probeDir = join(probeRoot, '__sirkapisi_probe__');
    const pf = join(probeDir, 'p.js');
    const yem = `${b64u({alg:'HS256',typ:'JWT'})}.${b64u({role:'anon',ref:'__probe__'})}.sirkapisiprobe`;
    mkdirSync(probeDir, { recursive: true });
    writeFileSync(pf, `const _p='${yem}'\n`);
    const m = (readFileSync(pf, 'utf8').match(JWT) || []);
    fireProof = !!(m.length && role(m[0]) && role(m[0]).role === 'anon');
  }
} catch { fireProof = false; }
finally { if (probeDir) { try { rmSync(probeDir, { recursive: true, force: true }); } catch {} } }

console.log(`${TOOL} v${VER} · kapsam=tarayıcıya-inen (sunucu hariç) · kök: ${present.join(',') || '(yok)'} · dosya: ${scanned} · bayt: ${bytes} · JWT: ${jwtCount} · benzersiz: ${uniq.size} · service_role: ${crit.length} · ateşleme kanıtı: ${fireProof===true?'✔':fireProof===false?'✗':'—'}`);
for (const s of seen) console.log(`  ${s}`);

if (present.length === 0 || scanned === 0) {
  console.error('🟠 ÖLÇÜLEMEDİ (exit 3): taranacak tarayıcı çıktısı/kaynak yok — "temiz" DEĞİL.');
  process.exit(3);
}
if (crit.length) {
  console.error(`🔴 BUILD DÜŞÜRÜLDÜ (exit 1): ${crit.length} service_role JWT tarayıcı çıktısında (token basılmadı):`);
  for (const c of crit) console.error(`  ${c}`);
  process.exit(1);
}
if (fireProof !== true) {
  console.error('🟠 ÖLÇÜLEMEDİ (exit 3): ATEŞLEME KANITI BAŞARISIZ — kapı kendi yemini yakalayamadı; "JWT:0" anlamsız (kural 126).');
  process.exit(3);
}
console.log('✔ service_role JWT yok (tarayıcıya inen dosyalarda) · ateşleme kanıtlı.');
process.exit(0);
