alter table public.non_barcoded_products enable row level security;
alter table public.barcoded_products enable row level security;

drop policy if exists non_barcoded_products_read on public.non_barcoded_products;
create policy non_barcoded_products_read on public.non_barcoded_products
  for select to anon, authenticated
  using (true);

drop policy if exists barcoded_products_read on public.barcoded_products;
create policy barcoded_products_read on public.barcoded_products
  for select to anon, authenticated
  using (true);

-- Owner decision: the app inserts into barcoded_products with the public anon key (useCustomFood.js).
-- Keep this policy only if anonymous inserts stay; tighten the checks to the real column types and units.
drop policy if exists barcoded_products_insert on public.barcoded_products;
create policy barcoded_products_insert on public.barcoded_products
  for insert to anon, authenticated
  with check (
    barcode_id ~ '^[0-9]{8,14}$'
    and char_length(coalesce(product_name, '')) between 1 and 200
    and calories >= 0 and protein >= 0 and carbohydrates >= 0 and fats >= 0
  );

revoke update, delete, truncate on public.non_barcoded_products from anon, authenticated;
revoke update, delete, truncate on public.barcoded_products from anon, authenticated;
