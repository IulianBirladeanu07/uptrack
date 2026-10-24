import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const options = new Map();
for (let i = 0; i < args.length; i += 1) {
  if (!args[i].startsWith('--')) throw new Error(`Unexpected argument: ${args[i]}`);
  const key = args[i].slice(2);
  const value = args[i + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
  options.set(key, value);
  i += 1;
}

const category = options.get('category') || 'dairy';
const limit = Number(options.get('limit') || 25);
const output = options.get('output');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const offBaseUrl = 'https://search.openfoodfacts.org/search';
const userAgent = 'Uptrack/1.0 (https://github.com/IulianBirladeanu07/uptrack)';
const missingFields = ['fiber', 'sugar', 'salt', 'saturated_fats'];
const supabaseFields = [
  'id',
  'product_name_en',
  'product_name_ro',
  'category',
  'calories',
  'carbohydrates',
  'fats',
  'protein',
  ...missingFields,
];
const stopWords = new Set([
  'a', 'an', 'and', 'de', 'din', 'for', 'from', 'in', 'la', 'of', 'or', 'pentru', 'the', 'with',
]);
const aliases = new Map([
  ['iaurt', 'yogurt'],
  ['yoghurt', 'yogurt'],
  ['smantana', 'cream'],
  ['lapte', 'milk'],
  ['grasime', 'fat'],
]);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.');
}
if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
  throw new Error('--limit must be an integer from 1 to 100.');
}
if (!output) throw new Error('Pass --output with a new review JSON path.');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const valueAsNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function normalizeTokens(value) {
  return new Set(
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9%]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token))
      .map((token) => aliases.get(token) || token),
  );
}

function tokenScore(target, candidate) {
  const targetTokens = normalizeTokens(target);
  const candidateTokens = normalizeTokens(candidate);
  if (!targetTokens.size || !candidateTokens.size) return 0;
  const intersection = [...targetTokens].filter((token) => candidateTokens.has(token)).length;
  return (2 * intersection) / (targetTokens.size + candidateTokens.size);
}

function compareExistingMacros(row, nutriments) {
  const checks = [
    ['calories', ['energy-kcal_100g', 'energy-kcal_value'], 15],
    ['carbohydrates', ['carbohydrates_100g'], 2],
    ['fats', ['fat_100g'], 2],
    ['protein', ['proteins_100g'], 2],
  ];
  const results = [];
  for (const [field, sourceKeys, tolerance] of checks) {
    const existing = valueAsNumber(row[field]);
    const sourceKey = sourceKeys.find((key) => valueAsNumber(nutriments?.[key]) !== null);
    if (existing === null || !sourceKey) continue;
    const sourceValue = valueAsNumber(nutriments[sourceKey]);
    results.push({ field, existing, source: sourceValue, agrees: Math.abs(existing - sourceValue) <= tolerance });
  }
  return results;
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 180).replace(/\s+/g, ' ')}`);
  return JSON.parse(body);
}

const query = new URLSearchParams({
  select: supabaseFields.join(','),
  category: `eq.${category}`,
  or: `(${missingFields.map((field) => `${field}.is.null`).join(',')})`,
  order: 'product_name_en.asc',
  limit: String(limit),
});
const rows = await fetchJson(`${supabaseUrl}/rest/v1/non_barcoded_products?${query}`, {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
});
if (!Array.isArray(rows)) throw new Error('Supabase returned an unexpected result.');

const results = [];
for (let index = 0; index < rows.length; index += 1) {
  const row = rows[index];
  const searchTerms = [...new Set([row.product_name_ro, row.product_name_en].filter(Boolean))];
  let payload;
  let searchTerm = searchTerms[0];
  try {
    const search = async (term) => {
      if (index > 0 || term !== searchTerms[0]) await sleep(1000);
      const offQuery = new URLSearchParams({
        q: term,
        langs: 'ro,en',
        page_size: '10',
        fields: 'product_name,product_name_en,brands,nutriments',
      });
      return fetchJson(`${offBaseUrl}?${offQuery}`, { 'User-Agent': userAgent });
    };
    payload = await search(searchTerm);
    const firstBestScore = Math.max(0, ...(payload.hits || []).map((product) => Math.max(
      tokenScore(row.product_name_ro, product.product_name),
      tokenScore(row.product_name_en, product.product_name_en || product.product_name),
    )));
    if (firstBestScore < 0.4 && searchTerms.length > 1) {
      searchTerm = searchTerms[1];
      payload = await search(searchTerm);
    }
  } catch (error) {
    results.push({
      id: row.id,
      product_name_en: row.product_name_en,
      product_name_ro: row.product_name_ro,
      category: row.category,
      missing: missingFields.filter((field) => row[field] == null),
      status: 'lookup_error',
      error: error.message,
      candidates: [],
    });
    process.stdout.write(`\r${index + 1}/${rows.length}: lookup unavailable`);
    continue;
  }

  const candidates = (payload.hits || []).map((product) => {
    const nameScore = Math.max(
      tokenScore(row.product_name_ro, product.product_name),
      tokenScore(row.product_name_en, product.product_name_en || product.product_name),
    );
    const targetTokens = new Set([
      ...normalizeTokens(row.product_name_ro),
      ...normalizeTokens(row.product_name_en),
    ]);
    const brandTokens = normalizeTokens(Array.isArray(product.brands) ? product.brands.join(' ') : product.brands);
    const brandMatch = brandTokens.size > 0 && [...brandTokens].some((token) => targetTokens.has(token));
    const macroChecks = compareExistingMacros(row, product.nutriments || {});
    const macroAgreement = macroChecks.length > 0 && macroChecks.every((check) => check.agrees);
    const nutriments = product.nutriments || {};
    const foundValues = {
      fiber: valueAsNumber(nutriments.fiber_100g),
      sugar: valueAsNumber(nutriments.sugars_100g),
      salt: valueAsNumber(nutriments.salt_100g),
      saturated_fats: valueAsNumber(nutriments['saturated-fat_100g']),
    };
    const availableValues = Object.fromEntries(
      Object.entries(foundValues).filter(([, value]) => value !== null),
    );
    const exactName = nameScore >= 0.9;
    const status = exactName && brandMatch && macroAgreement ? 'strong_candidate_review' : 'manual_review';
    return {
      product_name: product.product_name || null,
      product_name_en: product.product_name_en || null,
      brands: product.brands || null,
      source_url: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process`,
      name_score: Number(nameScore.toFixed(3)),
      brand_match: brandMatch,
      macro_agreement: macroAgreement,
      macro_checks: macroChecks,
      nutrient_values_per_100g: availableValues,
      status,
    };
  }).filter((candidate) => candidate.name_score >= 0.5)
    .sort((a, b) => b.name_score - a.name_score).slice(0, 3);

  const best = candidates[0];
  results.push({
    id: row.id,
    product_name_en: row.product_name_en,
    product_name_ro: row.product_name_ro,
    category: row.category,
    missing: missingFields.filter((field) => row[field] == null),
    status: best?.status || 'no_candidate',
    candidates,
  });
  process.stdout.write(`\r${index + 1}/${rows.length}: ${best?.status || 'no candidate'}`);
}
process.stdout.write('\n');

const summary = {
  generated_at: new Date().toISOString(),
  source: 'Open Food Facts Search-a-licious text search; candidate values are unverified and are not written to Supabase.',
  reuse_terms: 'Open Food Facts data is published under ODbL; review attribution and share-alike terms before importing values into the shared product database.',
  category,
  requested_limit: limit,
  products_checked: rows.length,
  counts: results.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {}),
  products: results,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`Wrote review-only report for ${rows.length} products to ${output}`);
console.log(JSON.stringify(summary.counts));
