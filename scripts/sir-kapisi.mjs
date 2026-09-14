#!/usr/bin/env node
// sir-kapisi.mjs — içerik-tabanlı sır kapısı (derleme kapısı, yorum değil)
// KURAL: bir ad bir beyandır; kapı ADA değil İÇERİĞE bakar — JWT'nin role iddiasını çözer.
//
// KAPSAM (davranışta, yorumda değil): yalnız TARAYICIYA İNEN dosyalar taranır —
//   .next/static/** · dist/** · build/** · public/** · ham kaynak.
//   SUNUCU çıktısı (.next/server, .next/cache) HARİÇ: orada service_role NORMALDİR (doğru katman);
//   oraya kırmızı yakmak yanlış-kırmızıdır (platformun sahibi olduğunu ürünün kusuru sanmak).
//
// TAVAN: yalnız verilen ağaç. Vercel-env derleme gömmesini yakalamak için CI'da BUILD'DEN SONRA,
//        tarayıcı çıktısı (.next/static, dist) üzerinde çalışmalı.
// SIR HİJYENİ: token ASLA basılmaz — yalnız role + ref parmak izi + adres.
// Çıkış: 0 = tarandı, service_role YOK · 1 = service_role BULUNDU (build'i düşür) · 3 = ölçülemedi (taranacak yok)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TOOL = 'sir-kapisi', VER = '1.1.0';
const EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.css','.map','.txt','.env']);
const JWT = /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g;
// SUNUCU çıktısı ve yönetilen dizinler — davranışta hariç:
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

let scanned = 0, bytes = 0, jwtCount = 0; const crit = [], seen = [];
const present = ROOTS.filter(existsSync);
for (const root of present) for (const f of walk(root)) {
  let txt; try { txt = readFileSync(f, 'utf8'); } catch { continue; }
  scanned++; bytes += Buffer.byteLength(txt);
  const lines = txt.split('\n');
  for (let i = 0; i < lines.length; i++) for (const m of (lines[i].match(JWT) || [])) {
    jwtCount++;
    const r = role(m);
    if (!r) { seen.push(`${f}:${i+1} · JWT çözülemedi`); continue; }
    const rec = `${f}:${i+1} · role=${r.role} · ref=${r.ref}`;
    if (r.role === 'service_role') crit.push(rec); else seen.push(`${rec} · ${r.role==='anon'?'anon-ok':r.role}`);
  }
}

// Kimlik + payda (kural 122: eleyen ölçüt ne kadar elediğini basar — dosya VE bayt)
console.log(`${TOOL} v${VER} · kapsam=tarayıcıya-inen (sunucu çıktısı hariç) · kök: ${present.join(',') || '(yok)'} · dosya: ${scanned} · bayt: ${bytes} · JWT: ${jwtCount} · service_role: ${crit.length}`);
for (const s of seen) console.log(`  ${s}`);           // adres satırı, token yok

if (present.length === 0 || scanned === 0) {
  console.error('🟠 ÖLÇÜLEMEDİ (exit 3): taranacak tarayıcı çıktısı/kaynak yok — "temiz" DEĞİL. (build sonrası .next/static veya dist üzerinde çalıştırın)');
  process.exit(3);
}
if (crit.length) {
  console.error(`🔴 BUILD DÜŞÜRÜLDÜ (exit 1): ${crit.length} service_role JWT tarayıcı çıktısında bulundu (token basılmadı):`);
  for (const c of crit) console.error(`  ${c}`);
  process.exit(1);
}
console.log('✔ service_role JWT yok (tarayıcıya inen dosyalarda).');
process.exit(0);
