export const durationToMinutes = (d: unknown): number | null => {
  if (typeof d !== 'string') return null;
  const p = d.split(':').map(Number);
  if (p.length < 2 || p.length > 3 || p.some(isNaN)) return null;
  const [h, m] = p.length === 3 ? p : [0, p[0]];
  return h * 60 + m;
};

export const durationLabel = (d: unknown): string | null => {
  const m = durationToMinutes(d);
  if (m == null) return null;
  const n = Math.max(m, 1);
  return `${n} ${n === 1 ? 'min' : 'mins'}`;
};
