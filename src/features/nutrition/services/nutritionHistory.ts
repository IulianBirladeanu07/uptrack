import { queryClient } from '../../../shared/query/queryClient';
import type { DateInput } from '../../../shared/types';
import { formatDate, toLocalDate } from '../utils/dateUtils';
import { fetchNutritionForDateRange } from './mealService';

export type NutritionHistoryDay = { date: string; calories: number; protein: number };

type ClosedHistory = { through: string; days: NutritionHistoryDay[] };
type ReadRecentDays = (start: Date, end: Date) => NutritionHistoryDay[];

const QUERY_ROOT = 'meal-history';
const RECENT_WINDOW_DAYS = 30;

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const recentWindowStart = (now: Date): Date => addDays(now, -RECENT_WINDOW_DAYS);

export const loadNutritionHistory = async (
  uid: string,
  startDate: DateInput,
  endDate: DateInput,
  readRecentDays: ReadRecentDays | null,
  now: Date = new Date(),
): Promise<NutritionHistoryDay[]> => {
  const start = toLocalDate(startDate);
  const end = toLocalDate(endDate);
  const recentFrom = recentWindowStart(now);
  const startKey = formatDate(start);
  const recentKey = formatDate(recentFrom);

  if (!readRecentDays || formatDate(end) < recentKey) {
    return fetchNutritionForDateRange(uid, start, end);
  }
  if (startKey >= recentKey) return readRecentDays(start, end);

  const closedEnd = addDays(recentFrom, -1);
  const closedEndKey = formatDate(closedEnd);
  const queryKey = [QUERY_ROOT, uid, startKey];
  const cached = queryClient.getQueryData<ClosedHistory>(queryKey);

  let closedDays: NutritionHistoryDay[];
  if (cached && cached.through === closedEndKey) {
    closedDays = cached.days;
  } else {
    const resume = cached && cached.through < closedEndKey;
    const from = resume ? addDays(toLocalDate(cached.through), 1) : start;
    const fetched = await fetchNutritionForDateRange(uid, from, closedEnd);
    closedDays = resume ? [...cached.days, ...fetched] : fetched;
    queryClient.setQueryData<ClosedHistory>(queryKey, { through: closedEndKey, days: closedDays });
  }

  return [...closedDays, ...readRecentDays(recentFrom, end)];
};

export const invalidateNutritionHistoryForDay = (uid: string, dateKey: string, now: Date = new Date()): void => {
  if (dateKey >= formatDate(recentWindowStart(now))) return;
  queryClient.removeQueries({ queryKey: [QUERY_ROOT, uid] });
};
