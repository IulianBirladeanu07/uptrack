import { formatLocalDateKey } from '../utils/localDateKey';

export type DailySteps = Record<string, number>;

export type StepBucket = {
  startTime: string;
  result: { COUNT_TOTAL?: number };
};

const ZONED = /(Z|[+-]\d{2}:?\d{2})$/;

export const toDateKey = (startTime: string): string => {
  const timePart = startTime.split('T')[1] ?? '';
  if (!ZONED.test(timePart)) return startTime.slice(0, 10);
  return formatLocalDateKey(new Date(startTime));
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
