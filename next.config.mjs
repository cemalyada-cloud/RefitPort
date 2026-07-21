/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // SEO: Türkçe URL'ler ayrı görünür, aynı sayfaya bağlanır
      { source: '/tr/firma/:slug', destination: '/tr/company/:slug' },
    ];
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
};
export default nextConfig;
