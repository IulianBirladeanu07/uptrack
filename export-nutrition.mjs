import { writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const table = process.env.TABLE || 'non_barcoded_products';
const out = process.env.OUT || 'nutrition.json';
const pageSize = Number(process.env.PAGE_SIZE || 1000);

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY first.');
  process.exit(1);
}

const nutrients = [
  'calories',
  'protein',
  'carbohydrates',
  'fats',
  'saturated_fats',
  'sugar',
  'fiber',
  'salt',
  'serving_size_value',
  'serving_size_unit',
];
const columns = ['id', 'product_name_en', 'category', ...nutrients].join(',');

const fetchPage = async (offset) => {
  const query = `select=${columns}&order=id.asc&limit=${pageSize}&offset=${offset}`;
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
  }
  return response.json();
};

const rows = [];
for (let offset = 0; ; offset += pageSize) {
  const page = await fetchPage(offset);
  rows.push(...page);
  process.stdout.write(`\rfetched ${rows.length}`);
  if (page.length < pageSize) break;
}
process.stdout.write('\n');

await writeFile(out, JSON.stringify(rows, null, 2));

console.log(`wrote ${rows.length} products to ${out}`);
for (const name of nutrients.slice(0, 8)) {
  const missing = rows.filter((r) => r[name] === null || r[name] === undefined).length;
  const zero = rows.filter((r) => r[name] === 0).length;
  console.log(`${name}: ${missing} null, ${zero} zero`);
}
