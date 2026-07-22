const MAP = { ç:'c', ğ:'g', ı:'i', ö:'o', ş:'s', ü:'u', Ç:'c', Ğ:'g', İ:'i', Ö:'o', Ş:'s', Ü:'u' };
export function slugify(s) {
  return (s || '')
    .split('').map((ch) => MAP[ch] ?? ch).join('')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
