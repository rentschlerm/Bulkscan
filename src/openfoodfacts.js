// Packaged food lookup via Open Food Facts (free, no key). Barcode = label-exact values.
const UA = { 'User-Agent': 'BulkScan/1.0 (personal Android app)' };
const FIELDS = 'code,product_name,brands,nutriments,serving_quantity,serving_size';

function toFood(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184; // kJ → kcal
  if (kcal == null) return null;
  return {
    id: 'off-' + p.code,
    name: [p.product_name, p.brands].filter(Boolean).join(' · ') || 'Unnamed product',
    per100: {
      kcal: Math.round(kcal),
      protein: Number(n.proteins_100g || 0),
      carbs: Number(n.carbohydrates_100g || 0),
      fat: Number(n.fat_100g || 0),
    },
    serving: Number(p.serving_quantity) || 100,
    servingLabel: p.serving_size || '100 g',
    source: 'barcode',
  };
}

export async function lookupBarcode(code) {
  const r = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
    { headers: UA }
  );
  if (!r.ok) throw new Error('Lookup failed (' + r.status + ')');
  const j = await r.json();
  if (j.status !== 1) return null;
  return toFood(j.product);
}

export async function searchProducts(q) {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&json=1&page_size=20' +
    `&fields=${FIELDS}&search_terms=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.products || []).map(toFood).filter(Boolean);
}
