import { notFound } from 'next/navigation';
import CompanyCard from '../../../../components/CompanyCard';
import { getListing, getRegions, getCategories } from '../../../../lib/data';
import { t, pick, LANGS } from '../../../../lib/i18n';

export const revalidate = 600;

export async function generateStaticParams() {
  const [regions, categories] = await Promise.all([getRegions(), getCategories()]);
  const params = [];
  for (const lang of LANGS)
    for (const r of regions)
      for (const c of categories)
        params.push({ lang, region: r.slug, category: c.slug });
  return params;
}

export async function generateMetadata({ params }) {
  const { lang, region, category } = params;
  const data = await getListing(region, category);
  if (!data) return {};
  const rn = pick(lang, data.region.name_tr, data.region.name_en);
  const cn = pick(lang, data.category.name_tr, data.category.name_en);
  return {
    title: `${cn} — ${rn} | RefitPort`,
    description: lang === 'tr'
      ? `${rn} bölgesinde ${cn} hizmeti veren firmalar. İletişim bilgileri ve referanslar.`
      : `Companies offering ${cn} in ${rn}. Contact details and verified references.`,
    alternates: {
      languages: { tr: `/tr/${region}/${category}`, en: `/en/${region}/${category}` },
    },
  };
}

export default async function Listing({ params }) {
  const { lang, region, category } = params;
  const data = await getListing(region, category);
  if (!data) notFound();

  const rn = pick(lang, data.region.name_tr, data.region.name_en);
  const cn = pick(lang, data.category.name_tr, data.category.name_en);
  const total = data.featured.length + data.organic.length;

  return (
    <div className="wrap">
      <section className="section">
        <h2>{rn}</h2>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 6 }}>{cn}</h1>
        <p style={{ color: 'var(--fog)', fontSize: '.85rem' }}>{total} {t[lang].results}</p>
      </section>

      {total === 0 ? (
        <p className="empty">{t[lang].noResults}</p>
      ) : (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="cards">
            {data.featured.map((c) => (
              <CompanyCard key={c.id} lang={lang} company={c} featured />
            ))}
            {data.organic.map((c) => (
              <CompanyCard key={c.id} lang={lang} company={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
