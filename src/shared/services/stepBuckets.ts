export type DailySteps = Record<string, number>;

export type StepBucket = {
  startTime: string;
  result: { COUNT_TOTAL?: number };
};

const ZONED = /(Z|[+-]\d{2}:?\d{2})$/;

const pad = (n: number): string => String(n).padStart(2, '0');

export const toDateKey = (startTime: string): string => {
  const timePart = startTime.split('T')[1] ?? '';
  if (!ZONED.test(timePart)) return startTime.slice(0, 10);
  const d = new Date(startTime);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const bucketsToDailySteps = (buckets: StepBucket[]): DailySteps => {
  const byDate: DailySteps = {};
  buckets.forEach(({ startTime, result }) => {
    const total = result.COUNT_TOTAL;
    if (typeof total !== 'number' || !Number.isFinite(total)) return;
    const key = toDateKey(startTime);
    byDate[key] = (byDate[key] ?? 0) + total;
  });
  return byDate;
};
