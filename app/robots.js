const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://refitport.com';

export default function robots() {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/tr/admin', '/en/admin', '/tr/panel', '/en/panel', '/tr/giris', '/en/giris', '/api/'],
    }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
