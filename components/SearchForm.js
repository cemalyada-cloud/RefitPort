'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { t, pick } from '../lib/i18n';

export default function SearchForm({ lang, categories, regions }) {
  const router = useRouter();
  const [cat, setCat] = useState('');
  const [reg, setReg] = useState(regions[0]?.slug || '');

  function go(e) {
    e.preventDefault();
    if (!cat || !reg) return;
    router.push(`/${lang}/${reg}/${cat}`);
  }

  return (
    <form className="searchbox" onSubmit={go}>
      <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t[lang].service}>
        <option value="">{t[lang].chooseService}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{pick(lang, c.name_tr, c.name_en)}</option>
        ))}
      </select>
      <select value={reg} onChange={(e) => setReg(e.target.value)} aria-label={t[lang].region}>
        {regions.map((r) => (
          <option key={r.slug} value={r.slug}>{pick(lang, r.name_tr, r.name_en)}</option>
        ))}
      </select>
      <button type="submit">{t[lang].search}</button>
    </form>
  );
}
