import { SiteHeader, SiteFooter } from '../../components/SiteChrome';
import { LANGS } from '../../lib/i18n';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default function LangLayout({ children, params }) {
  const { lang } = params;
  if (!LANGS.includes(lang)) notFound();
  return (
    <>
      <SiteHeader lang={lang} />
      <main>{children}</main>
      <SiteFooter lang={lang} />
    </>
  );
}
