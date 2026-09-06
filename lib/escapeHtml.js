// Kullanıcı/kaynak girdisini HTML bağlamına (e-posta şablonları vb.) güvenle
// gömmek için. Tüm HTML-anlamlı karakterleri kaçırır. null/undefined -> ''.
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
