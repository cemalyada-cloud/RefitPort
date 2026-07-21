import { supabase } from './supabase';

export async function getCategories() {
  const { data } = await supabase
    .from('marketplace_categories')
    .select('slug,name_tr,name_en')
    .eq('active', true)
    .order('sort_order');
  return data || [];
}

export async function getRegions() {
  const { data } = await supabase
    .from('marketplace_regions')
    .select('slug,name_tr,name_en,is_hub')
    .eq('active', true)
    .order('sort_order');
  return data || [];
}

export async function getBySlug(table, slug) {
  const { data } = await supabase.from(table).select('*').eq('slug', slug).maybeSingle();
  return data;
}

/** Bir bölge + kategori için yayındaki firmalar; vitrin üstte */
export async function getListing(regionSlug, categorySlug) {
  const region = await getBySlug('marketplace_regions', regionSlug);
  const category = await getBySlug('marketplace_categories', categorySlug);
  if (!region || !category) return null;

  const { data: inRegion } = await supabase
    .from('marketplace_company_regions')
    .select('company_id')
    .eq('region_id', region.id);
  const { data: inCategory } = await supabase
    .from('marketplace_company_categories')
    .select('company_id')
    .eq('category_id', category.id);

  const regionIds = new Set((inRegion || []).map((r) => r.company_id));
  const ids = (inCategory || []).map((c) => c.company_id).filter((id) => regionIds.has(id));

  let companies = [];
  if (ids.length) {
    const { data } = await supabase
      .from('marketplace_companies')
      .select('*')
      .in('id', ids)
      .eq('status', 'published');
    companies = data || [];
  }

  // vitrin slotlari
  const today = new Date().toISOString().slice(0, 10);
  const { data: slots } = await supabase
    .from('marketplace_featured_slots')
    .select('company_id')
    .eq('region_id', region.id)
    .eq('category_id', category.id)
    .eq('active', true)
    .lte('starts_at', today)
    .gte('ends_at', today);
  const featuredIds = new Set((slots || []).map((s) => s.company_id));

  // onayli referans sayilari
  const { data: refs } = await supabase
    .from('marketplace_references_public')
    .select('company_id');
  const refCount = {};
  (refs || []).forEach((r) => { refCount[r.company_id] = (refCount[r.company_id] || 0) + 1; });

  companies = companies.map((c) => ({ ...c, ref_count: refCount[c.id] || 0 }));

  const featured = companies.filter((c) => featuredIds.has(c.id));
  const organic = companies
    .filter((c) => !featuredIds.has(c.id))
    .sort((a, b) =>
      (b.ref_count - a.ref_count) ||
      (profileScore(b) - profileScore(a)) ||
      a.name.localeCompare(b.name, 'tr')
    );

  return { region, category, featured, organic };
}

function profileScore(c) {
  let s = 0;
  if (c.logo_url) s++;
  if (c.description_tr) s++;
  if (c.description_en) s++;
  if (c.website) s++;
  return s;
}

export async function getCompany(slug) {
  const { data: company } = await supabase
    .from('marketplace_companies')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!company) return null;

  const [{ data: cats }, { data: regs }, { data: imgs }, { data: refs }] = await Promise.all([
    supabase.from('marketplace_company_categories').select('category_id').eq('company_id', company.id),
    supabase.from('marketplace_company_regions').select('region_id').eq('company_id', company.id),
    supabase.from('marketplace_company_images').select('*').eq('company_id', company.id)
      .eq('approved', true).order('sort_order'),
    supabase.from('marketplace_references_public').select('*').eq('company_id', company.id),
  ]);

  const catIds = (cats || []).map((c) => c.category_id);
  const regIds = (regs || []).map((r) => r.region_id);

  const { data: categories } = catIds.length
    ? await supabase.from('marketplace_categories').select('*').in('id', catIds).order('sort_order')
    : { data: [] };
  const { data: regions } = regIds.length
    ? await supabase.from('marketplace_regions').select('*').in('id', regIds).order('sort_order')
    : { data: [] };

  return {
    company,
    categories: categories || [],
    regions: regions || [],
    images: imgs || [],
    references: refs || [],
  };
}

export async function getPublishedSlugs() {
  const { data } = await supabase
    .from('marketplace_companies')
    .select('slug')
    .eq('status', 'published');
  return (data || []).map((c) => c.slug);
}
