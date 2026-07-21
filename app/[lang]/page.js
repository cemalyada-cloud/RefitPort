import Link from 'next/link';
import SearchForm from '../../components/SearchForm';
import { getCategories, getRegions } from '../../lib/data';
import { t, pick } from '../../lib/i18n';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { lang } = params;
  return {
    title: lang === 'tr' ? 'RefitPort — Yat Bakım, Onarım ve Kışlama Rehberi'
                         : 'RefitPort — Yacht Refit, Service & Wintering Directory',
    description: t[lang].intro,
    alternates: { languages: { tr: '/tr', en: '/en' } },
  };
}

export default async function Home({ params }) {
  const { lang } = params;
  const [categories, regions] = await Promise.all([getCategories(), getRegions()]);
  const hub = regions.find((r) => r.is_hub) || regions[0];

  return (
    <>
      <section className="hero wrap">
        <h1>{t[lang].tagline}</h1>
        <p>{t[lang].intro}</p>
        <SearchForm lang={lang} categories={categories} regions={regions} />
      </section>

      <section className="section wrap">
        <h2>{t[lang].popularRegions}</h2>
        <div className="chips">
          {regions.map((r) => (
            <Link key={r.slug} className="chip"
              href={`/${lang}/${r.slug}/${categories[0]?.slug || 'boya-bakim'}`}>
              {pick(lang, r.name_tr, r.name_en)}
            </Link>
          ))}
        </div>
      </section>

      <section className="section wrap">
        <h2>{t[lang].allServices}</h2>
        <div className="chips">
          {categories.map((c) => (
            <Link key={c.slug} className="chip" href={`/${lang}/${hub?.slug || 'marmaris'}/${c.slug}`}>
              {pick(lang, c.name_tr, c.name_en)}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
