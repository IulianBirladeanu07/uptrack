jest.mock('./mealService', () => ({
  fetchNutritionForDateRange: jest.fn(),
}));

import { queryClient, clearUserScopedQueries } from '../../../shared/query/queryClient';
import { formatDate } from '../utils/dateUtils';
import { fetchNutritionForDateRange } from './mealService';
import { invalidateNutritionHistoryForDay, loadNutritionHistory } from './nutritionHistory';

const fetchMock = fetchNutritionForDateRange as jest.Mock;
const day = (date: string, calories = 2000) => ({ date, calories, protein: 100 });

const phaseStart = new Date(2026, 5, 8);
const today = new Date(2026, 9, 22);
const tomorrow = new Date(2026, 9, 23);
const recent = jest.fn();

const fetchedRanges = () =>
  fetchMock.mock.calls.map(([, from, to]) => [formatDate(from as Date), formatDate(to as Date)]);

describe('loadNutritionHistory', () => {
  beforeEach(() => {
    queryClient.clear();
    fetchMock.mockReset();
    recent.mockReset();
    fetchMock.mockResolvedValue([day('2026-06-09')]);
    recent.mockReturnValue([day('2026-10-21'), day('2026-10-22')]);
  });

  test('reads the closed part from Firestore and the last 30 days from the cache', async () => {
    const result = await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchedRanges()).toEqual([['2026-06-08', '2026-09-21']]);
    expect(formatDate(recent.mock.calls[0][0])).toBe('2026-09-22');
    expect(formatDate(recent.mock.calls[0][1])).toBe('2026-10-22');
    expect(result.map(entry => entry.date)).toEqual(['2026-06-09', '2026-10-21', '2026-10-22']);
  });

  test('a second load on the same day does not read the closed part again', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);
    const second = await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.map(entry => entry.date)).toEqual(['2026-06-09', '2026-10-21', '2026-10-22']);
  });

  test('the next day reads only the day that has just closed and keeps the earlier days', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);
    fetchMock.mockClear();
    fetchMock.mockResolvedValue([day('2026-09-22')]);

    const result = await loadNutritionHistory('user-1', phaseStart, tomorrow, recent, tomorrow);

    expect(fetchedRanges()).toEqual([['2026-09-22', '2026-09-22']]);
    expect(result.slice(0, 2).map(entry => entry.date)).toEqual(['2026-06-09', '2026-09-22']);
  });

  test('shows meals added today from the cache without any read', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);
    recent.mockReturnValue([day('2026-10-22', 2400)]);

    const result = await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result[result.length - 1]).toEqual(day('2026-10-22', 2400));
  });

  test('a range inside the last 30 days is served from the cache alone', async () => {
    const result = await loadNutritionHistory('user-1', new Date(2026, 9, 1), today, recent, today);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual([day('2026-10-21'), day('2026-10-22')]);
  });

  test('reads everything from Firestore without caching when the meal cache is not loaded', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, null, today);
    await loadNutritionHistory('user-1', phaseStart, today, null, today);

    expect(fetchedRanges()).toEqual([['2026-06-08', '2026-10-22'], ['2026-06-08', '2026-10-22']]);
  });

  test('a range that ends before the last 30 days is read directly and not cached', async () => {
    await loadNutritionHistory('user-1', phaseStart, new Date(2026, 8, 1), recent, today);
    await loadNutritionHistory('user-1', phaseStart, new Date(2026, 8, 1), recent, today);

    expect(fetchedRanges()).toEqual([['2026-06-08', '2026-09-01'], ['2026-06-08', '2026-09-01']]);
    expect(recent).not.toHaveBeenCalled();
  });

  test('keeps a separate closed history for each account', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);
    await loadNutritionHistory('user-2', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('does not cache a failed read, so the next load tries again', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(loadNutritionHistory('user-1', phaseStart, today, recent, today)).rejects.toThrow('offline');
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('is cleared with the other user-scoped queries', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    clearUserScopedQueries();
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('invalidateNutritionHistoryForDay', () => {
  beforeEach(() => {
    queryClient.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue([day('2026-06-09')]);
    recent.mockReset();
    recent.mockReturnValue([]);
  });

  test('forgets the closed history when a day older than 30 days is edited', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    invalidateNutritionHistoryForDay('user-1', '2026-08-15', today);
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('keeps it when a day inside the last 30 days is edited', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    invalidateNutritionHistoryForDay('user-1', '2026-10-10', today);
    invalidateNutritionHistoryForDay('user-1', '2026-09-22', today);
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('only affects the given account', async () => {
    await loadNutritionHistory('user-1', phaseStart, today, recent, today);
    await loadNutritionHistory('user-2', phaseStart, today, recent, today);

    invalidateNutritionHistoryForDay('user-1', '2026-08-15', today);
    await loadNutritionHistory('user-2', phaseStart, today, recent, today);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
