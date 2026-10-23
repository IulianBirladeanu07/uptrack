import { writeFile } from 'node:fs/promises';

const bucket = process.env.BUCKET || 'activerecovery-3a400.firebasestorage.app';
const prefix = process.env.PREFIX || 'nutrition_images/';
const out = process.env.OUT || 'storage-images.json';
const base = process.env.STORAGE_BASE || 'https://firebasestorage.googleapis.com';

const items = [];
let pageToken = '';
do {
  const query = `prefix=${encodeURIComponent(prefix)}&maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
  const response = await fetch(`${base}/v0/b/${bucket}/o?${query}`);
  if (!response.ok) {
    throw new Error(`Firebase Storage returned ${response.status}: ${await response.text()}`);
  }
  const body = await response.json();
  items.push(...(body.items || []));
  pageToken = body.nextPageToken || '';
  process.stdout.write(`\rlisted ${items.length}`);
} while (pageToken);
process.stdout.write('\n');

const files = items
  .map((item) => item.name)
  .filter((path) => !path.endsWith('/'))
  .map((path) => {
    const slash = path.lastIndexOf('/');
    const file = path.slice(slash + 1);
    const dot = file.lastIndexOf('.');
    return {
      path,
      folder: path.slice(0, slash),
      file,
      stem: dot > 0 ? file.slice(0, dot) : file,
    };
  });

await writeFile(out, JSON.stringify(files, null, 2));

const folders = new Map();
for (const file of files) folders.set(file.folder, (folders.get(file.folder) || 0) + 1);
console.log(`wrote ${files.length} files in ${folders.size} folders to ${out}`);
