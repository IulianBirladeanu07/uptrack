import { readFile } from 'node:fs/promises';

const products = JSON.parse(await readFile(process.argv[2] || 'audit-data/products.json', 'utf8'));
const stemWords = (file) => file.replace(/\.[^.]+$/, '').toLowerCase().split(/[_\s-]+/).filter((t) => t.length > 2);

const broken = products.filter((p) => p.image_url && !p.image_path);
const missing = products.filter((p) => !p.image_url);
const byImage = new Map();
for (const p of products.filter((x) => x.image_path)) {
  const names = `${p.name_en} ${p.name_ro}`.toLowerCase();
  const hit = stemWords(p.image_file).some((t) => names.includes(t.replace(/s$/, '')));
  const s = byImage.get(p.image_path) || { n: 0, miss: [] };
  s.n++;
  if (!hit) s.miss.push(p.name_en);
  byImage.set(p.image_path, s);
}

console.log(`products ${products.length}, broken image values ${broken.length}, no image ${missing.length}`);
console.log(`ro name equals en name: ${products.filter((p) => p.name_ro && p.name_en && p.name_ro.toLowerCase() === p.name_en.toLowerCase()).length}`);
const rows = [...byImage].map(([k, s]) => [k, s.n, s.miss.length]).sort((a, b) => b[2] - a[2]).slice(0, 25);
for (const [k, n, m] of rows) console.log(`${k} used ${n} no word match ${m}`);
