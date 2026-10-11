const METRIC_PER_UNIT: Record<string, number> = {
  g: 1,
  ml: 1,
  oz: 28.3495,
  cup: 236.588,
};

const MIN_QUANTITY = 0.01;

const norm = (u?: string | null): string => (u ? u.toLowerCase() : '');

export const scalingFactor = (
  quantity: number,
  unit: string | null | undefined,
  baseQuantity: number | null | undefined,
  baseUnit: string | null | undefined,
): number => {
  const base = baseQuantity || 100;
  const u = norm(unit);
  const bu = norm(baseUnit);

  if (u === 'serving') return bu === 'serving' ? quantity / base : quantity;

  const f = METRIC_PER_UNIT[u];
  const bf = METRIC_PER_UNIT[bu];
  if (f === undefined || bf === undefined) return quantity / base;

  return (quantity * f) / (base * bf);
};

export const convertQuantity = (
  quantity: number,
  from: string | null | undefined,
  to: string | null | undefined,
  baseQuantity: number | null | undefined,
  baseUnit: string | null | undefined,
): number => {
  const f = norm(from);
  const t = norm(to);
  if (f === t) return quantity;
  if (t === 'serving') return 1;

  const tf = METRIC_PER_UNIT[t];
  if (tf === undefined) return quantity;

  let metric: number;
  if (f === 'serving') {
    const bf = METRIC_PER_UNIT[norm(baseUnit)];
    if (bf === undefined) return quantity;
    metric = quantity * (baseQuantity || 100) * bf;
  } else {
    const ff = METRIC_PER_UNIT[f];
    if (ff === undefined) return quantity;
    metric = quantity * ff;
  }

  return Math.max(MIN_QUANTITY, Number((metric / tf).toFixed(2)));
};
