const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(2);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: class {} },
});

const PROBE_BARCODE = '99999999999999';
const PROBE_NAME = '__rls_probe__';
const withInsert = process.argv.includes('--insert');

const row = (over = {}) => ({
  barcode_id: PROBE_BARCODE,
  product_name: PROBE_NAME,
  calories: 1,
  carbohydrates: 1,
  fats: 1,
  protein: 1,
  fiber: 0,
  sugar: 0,
  salt: 0,
  saturated_fats: 0,
  serving_size_unit: 'g',
  serving_size_value: 100,
  category: '',
  last_updated: new Date().toISOString(),
  ...over,
});

let wrote = false;

const insert = async (r) => {
  const res = await sb.from('barcoded_products').insert([r]);
  if (!res.error) wrote = true;
  return res;
};

const fmt = (error) => `${error.code} ${error.message}`;

const denied = ({ error }) => {
  if (error && error.code === '42501') return null;
  return `expected 42501, got ${error ? fmt(error) : 'success'}`;
};

const checks = [
  ['read non_barcoded_products', async () => {
    const { data, error } = await sb.from('non_barcoded_products').select('product_name_en').limit(1);
    if (error) return fmt(error);
    return data.length ? null : 'no rows returned';
  }],
  ['read barcoded_products', async () => {
    const { error } = await sb.from('barcoded_products').select('barcode_id').limit(1);
    return error ? fmt(error) : null;
  }],
  ['update barcoded_products blocked', async () =>
    denied(await sb.from('barcoded_products').update({ product_name: 'x' }).eq('barcode_id', PROBE_BARCODE))],
  ['delete barcoded_products blocked', async () =>
    denied(await sb.from('barcoded_products').delete().eq('barcode_id', PROBE_BARCODE))],
  ['update non_barcoded_products blocked', async () =>
    denied(await sb.from('non_barcoded_products').update({ product_name_en: 'x' }).eq('product_name_en', PROBE_NAME))],
  ['delete non_barcoded_products blocked', async () =>
    denied(await sb.from('non_barcoded_products').delete().eq('product_name_en', PROBE_NAME))],
  ['insert with short barcode rejected', async () => denied(await insert(row({ barcode_id: '123' })))],
  ['insert with negative calories rejected', async () => denied(await insert(row({ calories: -1 })))],
  ['insert with empty name rejected', async () => denied(await insert(row({ product_name: '' })))],
];

if (withInsert) {
  checks.push(['insert valid row accepted', async () => {
    const found = await sb.from('barcoded_products').select('barcode_id').eq('barcode_id', PROBE_BARCODE).maybeSingle();
    if (found.error) return fmt(found.error);
    if (found.data) return 'probe row already exists from an earlier run, delete it first';
    const { error } = await insert(row());
    return error ? fmt(error) : null;
  }]);
}

(async () => {
  let failed = 0;
  for (const [name, fn] of checks) {
    let reason;
    try {
      reason = await fn();
    } catch (e) {
      reason = e.message;
    }
    console.log(`${reason ? 'FAIL' : 'PASS'}  ${name}${reason ? `  ->  ${reason}` : ''}`);
    if (reason) failed++;
  }
  if (wrote || withInsert) {
    console.log(`\nCleanup in the SQL editor:\ndelete from public.barcoded_products where product_name = '${PROBE_NAME}';`);
  }
  process.exit(failed ? 1 : 0);
})();
