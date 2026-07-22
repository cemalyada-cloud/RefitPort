import { getRegions, getCategories, getPublishedSlugs } from '../lib/data';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refitport.com';

export const revalidate = 3600;

export default async function sitemap() {
  const [regions, categories, slugs] = await Promise.all([
    getRegions(), getCategories(), getPublishedSlugs(),
  ]);

  const urls = [];
  const now = new Date();

  // ana sayfalar
  for (const lang of ['tr', 'en']) {
    urls.push({ url: `${BASE}/${lang}`, lastModified: now, changeFrequency: 'weekly', priority: 1 });
  }

  // bölge + kategori kombinasyonları
  for (const lang of ['tr', 'en']) {
    for (const r of regions) {
      for (const c of categories) {
        urls.push({
          url: `${BASE}/${lang}/${r.slug}/${c.slug}`,
          lastModified: now, changeFrequency: 'daily', priority: 0.8,
        });
      }
    }
  }

  // firma profilleri
  for (const slug of slugs) {
    urls.push({ url: `${BASE}/tr/firma/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
    urls.push({ url: `${BASE}/en/company/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
  }

  return urls;
}
