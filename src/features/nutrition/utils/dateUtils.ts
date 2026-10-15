import type { DateInput } from '../../../shared/types';

export const toLocalDate = (date: DateInput): Date => {
  if (date instanceof Date) return new Date(date.getTime());

  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const localDate = new Date(year, month, day);
      if (
        localDate.getFullYear() !== year ||
        localDate.getMonth() !== month ||
        localDate.getDate() !== day
      ) {
        throw new RangeError(`Invalid local date: ${date}`);
      }
      return localDate;
    }
  }

  return new Date(date);
};

export const formatDate = (date: DateInput): string => {
  const d = toLocalDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const differenceInLocalDays = (later: DateInput, earlier: DateInput): number => {
  const laterDate = toLocalDate(later);
  const earlierDate = toLocalDate(earlier);
  const dayMs = 24 * 60 * 60 * 1000;
  const laterDay = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate());
  const earlierDay = Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate());
  return Math.round((laterDay - earlierDay) / dayMs);
};

export const getLocalDateBucket = (
  anchor: DateInput,
  index: number,
  bucketDays: number,
): { start: Date; end: Date } => {
  const start = toLocalDate(anchor);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + Math.floor(index * bucketDays));

  const nextStart = toLocalDate(anchor);
  nextStart.setHours(0, 0, 0, 0);
  nextStart.setDate(nextStart.getDate() + Math.floor((index + 1) * bucketDays));

  return { start, end: new Date(nextStart.getTime() - 1) };
};
