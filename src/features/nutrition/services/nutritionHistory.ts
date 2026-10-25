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
  const queryKey = [QUERY_ROOT, uid, 'closed-through', startKey] as const;
  const closedHistory = await queryClient.fetchQuery({
    queryKey,
    queryFn: async (): Promise<ClosedHistory> => {
      const cached = queryClient.getQueryData<ClosedHistory>(queryKey);
      if (cached && cached.through === closedEndKey) return cached;
      const resume = cached && cached.through < closedEndKey;
      const from = resume ? addDays(toLocalDate(cached.through), 1) : start;
      const fetched = await fetchNutritionForDateRange(uid, from, closedEnd);
      return {
        through: closedEndKey,
        days: resume ? [...cached.days, ...fetched] : fetched,
      };
    },
    staleTime: 0,
    retry: false,
  });

  return [...closedHistory.days, ...readRecentDays(recentFrom, end)];
};

export const invalidateNutritionHistoryForDay = (uid: string, dateKey: string, now: Date = new Date()): void => {
  if (dateKey >= formatDate(recentWindowStart(now))) return;
  queryClient.removeQueries({ queryKey: [QUERY_ROOT, uid] });
};
