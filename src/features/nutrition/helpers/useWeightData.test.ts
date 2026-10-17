import { act, renderHook, waitFor } from '@testing-library/react-native';
import WeightService from '../services/weightService';
import useWeightData from './useWeightData';

jest.mock('../services/weightService', () => ({
  __esModule: true,
  default: { getWeightDisplayData: jest.fn() },
}));

const weight = {
  currentWeight: 70,
  weeklyAverage: 70.5,
  lastWeekAverage: 71,
  weeklyTrend: -0.5,
  weighInCount: 3,
};

describe('useWeightData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads by user and date, caches repeated loads, and refreshes on demand', async () => {
    (WeightService.getWeightDisplayData as jest.Mock).mockResolvedValue(weight);
    const { result, rerender } = renderHook(
      ({ date }) => useWeightData('user-1', date),
      { initialProps: { date: '2026-10-17' } },
    );
    await waitFor(() => expect(result.current.weightData).toEqual(weight));
    expect(WeightService.getWeightDisplayData).toHaveBeenCalledTimes(1);

    rerender({ date: '2026-10-17' });
    expect(WeightService.getWeightDisplayData).toHaveBeenCalledTimes(1);
    await act(async () => result.current.refreshWeightData());
    await waitFor(() => expect(WeightService.getWeightDisplayData).toHaveBeenCalledTimes(2));
  });

  it('does not load without a user and ignores stale responses after the selected date changes', async () => {
    let resolveFirst!: (value: typeof weight) => void;
    (WeightService.getWeightDisplayData as jest.Mock)
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ...weight, currentWeight: 68 });
    const { result, rerender } = renderHook(
      ({ userId, date }) => useWeightData(userId, date),
      { initialProps: { userId: null as string | null, date: '2026-10-16' } },
    );
    expect(WeightService.getWeightDisplayData).not.toHaveBeenCalled();

    rerender({ userId: 'user-1', date: '2026-10-16' });
    rerender({ userId: 'user-1', date: '2026-10-17' });
    await waitFor(() => expect(result.current.weightData.currentWeight).toBe(68));
    await act(async () => resolveFirst(weight));
    expect(result.current.weightData.currentWeight).toBe(68);
  });

  it('logs load failures without replacing the last successful weight data', async () => {
    (WeightService.getWeightDisplayData as jest.Mock)
      .mockResolvedValueOnce(weight)
      .mockRejectedValueOnce(new Error('offline'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useWeightData('user-1', '2026-10-17'));
    await waitFor(() => expect(result.current.weightData).toEqual(weight));

    await act(async () => result.current.refreshWeightData());
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(result.current.weightData).toEqual(weight);
    consoleError.mockRestore();
  });
});
