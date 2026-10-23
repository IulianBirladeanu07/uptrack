import { writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const table = process.env.TABLE || 'non_barcoded_products';
const out = process.env.OUT || 'products.json';
const pageSize = Number(process.env.PAGE_SIZE || 1000);

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY first.');
  process.exit(1);
}

const columns = 'id,product_name_en,product_name_ro,category,image';

const parseImage = (image) => {
  if (!image) return { path: null, folder: null, file: null };
  const match = /\/o\/([^?]+)/.exec(image);
  if (!match) return { path: null, folder: null, file: null };
  const path = decodeURIComponent(match[1]);
  const slash = path.lastIndexOf('/');
  return {
    path,
    folder: slash >= 0 ? path.slice(0, slash) : '',
    file: slash >= 0 ? path.slice(slash + 1) : path,
  };
};

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

const products = rows.map((row) => {
  const image = parseImage(row.image);
  return {
    id: row.id,
    name_en: row.product_name_en,
    name_ro: row.product_name_ro,
    category: row.category,
    image_url: row.image,
    image_path: image.path,
    image_folder: image.folder,
    image_file: image.file,
  };
});

await writeFile(out, JSON.stringify(products, null, 2));

const count = (test) => products.filter(test).length;
console.log(`wrote ${products.length} products to ${out}`);
console.log(`without an image: ${count((p) => !p.image_url)}`);
console.log(`image not on Firebase Storage: ${count((p) => p.image_url && !p.image_path)}`);
console.log(`without an English name: ${count((p) => !p.name_en)}`);
console.log(`without a Romanian name: ${count((p) => !p.name_ro)}`);
console.log(`distinct image files in use: ${new Set(products.map((p) => p.image_path).filter(Boolean)).size}`);
