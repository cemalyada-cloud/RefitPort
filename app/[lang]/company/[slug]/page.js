import { notFound } from 'next/navigation';
import LeadForm from '../../../../components/LeadForm';
import Gallery from '../../../../components/Gallery';
import ClaimButton from '../../../../components/ClaimButton';
import { getCompany, getPublishedSlugs } from '../../../../lib/data';
import { t, pick, LANGS } from '../../../../lib/i18n';

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  const out = [];
  for (const lang of LANGS) for (const slug of slugs) out.push({ lang, slug });
  return out;
}

export async function generateMetadata({ params }) {
  const data = await getCompany(params.slug);
  if (!data) return {};
  const { lang } = params;
  const desc = pick(lang, data.company.description_tr, data.company.description_en);
  return {
    title: `${data.company.name} | RefitPort`,
    description: (desc || '').slice(0, 160),
    alternates: {
      languages: { tr: `/tr/firma/${params.slug}`, en: `/en/company/${params.slug}` },
    },
  };
}

export default async function CompanyPage({ params }) {
  const { lang, slug } = params;
  const data = await getCompany(slug);
  if (!data) notFound();

  const { company, categories, regions, images, references } = data;
  const desc = pick(lang, company.description_tr, company.description_en);

  return (
    <div className="wrap">
      <div className="profile-head">
        {company.logo_url ? (
          <img className="logo" style={{ width: 72, height: 72 }} src={company.logo_url} alt="" />
        ) : (
          <div className="logo-fallback" style={{ width: 72, height: 72, fontSize: '1.4rem' }}>
            {company.name.charAt(0)}
          </div>
        )}
        <div>
          <h1>{company.name}</h1>
          <div className="badges">
            {references.length > 0 && (
              <span className="badge verified">✓ {t[lang].verifiedRef} ({references.length})</span>
            )}
            {company.founding_member && <span className="badge">{t[lang].foundingMember}</span>}
            {company.sub_location && <span className="badge">{company.sub_location}</span>}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div style={{ display: 'grid', gap: 18 }}>
          {desc && (
            <section className="panel">
              <h2>{t[lang].about}</h2>
              <p style={{ fontSize: '.92rem', whiteSpace: 'pre-line' }}>{desc}</p>
            </section>
          )}

          <section className="panel">
            <h2>{t[lang].services}</h2>
            <div className="chips">
              {categories.map((c) => (
                <span key={c.id} className="chip">{pick(lang, c.name_tr, c.name_en)}</span>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{t[lang].regions}</h2>
            <div className="chips">
              {regions.map((r) => (
                <span key={r.id} className="chip">{pick(lang, r.name_tr, r.name_en)}</span>
              ))}
            </div>
          </section>

          {images.length > 0 && (
            <section className="panel">
              <h2>{t[lang].gallery}</h2>
              <Gallery images={images} />
            </section>
          )}

          {references.length > 0 && (
            <section className="panel">
              <h2>{t[lang].references}</h2>
              {references.map((r) => (
                <div className="ref" key={r.id}>
                  <b>✓ {r.display_name}</b>
                  <p>{r.work_summary}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        <aside style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <section className="panel">
            <h2>{t[lang].contact}</h2>
            {company.phone && (
              <div className="kv"><span>{t[lang].phone}</span><a href={`tel:${company.phone}`}>{company.phone}</a></div>
            )}
            {company.email && (
              <div className="kv"><span>{t[lang].email}</span><a href={`mailto:${company.email}`}>{company.email}</a></div>
            )}
            {company.website && (
              <div className="kv"><span>{t[lang].website}</span>
                <a href={company.website} target="_blank" rel="noopener noreferrer">↗</a></div>
            )}
            {company.whatsapp && (
              <div className="kv"><span>WhatsApp</span>
                <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">↗</a></div>
            )}
          </section>

          <section className="panel">
            <h2>{t[lang].contact}</h2>
            <LeadForm lang={lang} companyId={company.id} />
          </section>

          {!company.is_claimed && (
            <section className="panel">
              <h2>{t[lang].isYours}</h2>
              <ClaimButton lang={lang} companyId={company.id} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
