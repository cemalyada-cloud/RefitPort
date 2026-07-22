import Link from 'next/link';
import { t } from '../lib/i18n';

export function SiteHeader({ lang }) {
  const other = lang === 'tr' ? 'en' : 'tr';
  return (
    <header className="site-head">
      <div className="wrap">
        <Link href={`/${lang}`} className="brand">
          <img src="/logo-mark.svg" alt="RefitPort" />
          REFIT<span>PORT</span>
        </Link>
        <nav className="lang-switch">
          <Link href={`/${lang}/giris`} style={{ marginRight: 6 }}>
            {lang === 'tr' ? 'Firma Girişi' : 'Company Login'}
          </Link>
          <Link href={`/${lang}`} className="on">{lang.toUpperCase()}</Link>
          <Link href={`/${other}`}>{other.toUpperCase()}</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ lang }) {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <p>{t[lang].freeForOwners}</p>
        <p style={{ marginTop: 8 }}>
          RefitPort — a <a href="https://superyachtapps.com">SuperyachtApps</a> product
        </p>
      </div>
    </footer>
  );
}
