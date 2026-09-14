#!/usr/bin/env node
// sir-kapisi.mjs — içerik-tabanlı sır kapısı (derleme kapısı, yorum değil)
// KURAL: bir ad bir beyandır; kapı ADA değil İÇERİĞE bakar — JWT'nin role iddiasını çözer.
// Kaynağı VE build çıktısını (dist/build/.next/assets) tarar; role=service_role bulursa build'i düşürür.
// TAVAN: yalnız bu ağaç. Vercel-env derleme gömmesini yakalamak için CI'da BUILD'DEN SONRA çalışmalı
//        (o zaman dist/ içinde inline anahtarı görür). Kaynakta çalışırsa yalnız hardcoded literalleri görür.
// SIR HİJYENİ: token ASLA basılmaz — yalnız role + ref parmak izi + adres.
// Çıkış: 0 = tarandı, service_role YOK · 1 = service_role BULUNDU (build'i düşür) · 3 = ölçülemedi (taranacak yok)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TOOL = 'sir-kapisi', VER = '1.0.0';
const EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.css','.map','.txt','.env']);
const JWT = /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;
const ROOTS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['src','app','components','lib','pages','dist','build','.next','assets','public','index.html'];

function* walk(p) {
  let st; try { st = statSync(p); } catch { return; }
  if (st.isDirectory()) {
    if (/node_modules|\.git/.test(p)) return;
    for (const e of readdirSync(p)) yield* walk(join(p, e));
  } else if (EXT.has(p.slice(p.lastIndexOf('.')))) yield p;
}
function role(jwt) {
  try {
    let s = jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    s += '='.repeat((4 - s.length % 4) % 4);
    const p = JSON.parse(Buffer.from(s, 'base64').toString('utf8'));
    return { role: p.role ?? '?', ref: p.ref ?? '?' };
  } catch { return null; }
}

let scanned = 0, jwtCount = 0; const crit = [], seen = [];
const present = ROOTS.filter(existsSync);
for (const root of present) for (const f of walk(root)) {
  scanned++;
  let txt; try { txt = readFileSync(f, 'utf8'); } catch { continue; }
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) for (const m of (lines[i].match(JWT) || [])) {
    jwtCount++;
    const r = role(m);
    if (!r) { seen.push(`${f}:${i+1} · JWT çözülemedi`); continue; }
    const rec = `${f}:${i+1} · role=${r.role} · ref=${r.ref}`;
    if (r.role === 'service_role') crit.push(rec); else seen.push(`${rec} · ${r.role==='anon'?'anon-ok':r.role}`);
  }
}

// Kimlik + payda (kural 122: eleyen ölçüt ne kadar elediğini basar)
console.log(`${TOOL} v${VER} · taranan kök: ${present.join(',') || '(yok)'} · dosya: ${scanned} · JWT: ${jwtCount} · service_role: ${crit.length}`);
for (const s of seen) console.log(`  ${s}`);           // adres satırı (kural 125-②), token yok

if (present.length === 0 || scanned === 0) {
  console.error('🟠 ÖLÇÜLEMEDİ: taranacak kaynak/build çıktısı yok — "temiz" DEĞİL. (build sonrası CI\'da çalıştırın)');
  process.exit(3);
}
if (crit.length) {
  console.error(`🔴 BUILD DÜŞÜRÜLDÜ: ${crit.length} service_role JWT bulundu (token basılmadı):`);
  for (const c of crit) console.error(`  ${c}`);
  process.exit(1);
}
console.log('✔ service_role JWT yok (bu ağaçta). Not: Vercel-env gömmesi yalnız build sonrası dist taramasında görünür.');
process.exit(0);
