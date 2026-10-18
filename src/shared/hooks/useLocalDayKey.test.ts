import { act, renderHook } from '@testing-library/react-native';
import { getLocalDayKey, useLocalDayKey } from './useLocalDayKey';

describe('getLocalDayKey', () => {
    it('formats a local calendar date without converting through UTC', () => {
        expect(getLocalDayKey(new Date(2026, 9, 18, 23, 59))).toBe('2026-10-18');
    });
});

describe('useLocalDayKey', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('updates after local midnight and reschedules for the next day', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 9, 18, 23, 59, 59));
        const { result, unmount } = renderHook(() => useLocalDayKey());
        expect(result.current).toBe('2026-10-18');

        act(() => {
            jest.advanceTimersByTime(1100);
        });
        expect(result.current).toBe('2026-10-19');
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});
