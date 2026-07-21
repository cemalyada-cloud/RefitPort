import Link from 'next/link';
import { t, pick } from '../lib/i18n';

export default function CompanyCard({ lang, company, featured }) {
  const desc = pick(lang, company.description_tr, company.description_en);
  const path = lang === 'tr' ? `/tr/firma/${company.slug}` : `/en/company/${company.slug}`;
  return (
    <Link href={path} className="card">
      <div className="card-top">
        {company.logo_url ? (
          <img className="logo" src={company.logo_url} alt="" />
        ) : (
          <div className="logo-fallback">{company.name.charAt(0)}</div>
        )}
        <div>
          <h3>{company.name}</h3>
          {company.sub_location && <div className="meta">{company.sub_location}</div>}
        </div>
      </div>
      {desc && <p className="desc">{desc}</p>}
      <div className="badges">
        {featured && <span className="badge featured">{t[lang].featured}</span>}
        {company.ref_count > 0 && (
          <span className="badge verified">✓ {t[lang].verifiedRef} ({company.ref_count})</span>
        )}
        {company.founding_member && <span className="badge">{t[lang].foundingMember}</span>}
      </div>
    </Link>
  );
}
