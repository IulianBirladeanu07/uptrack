import { colors } from '../../../../shared/theme';
import { getWeeklyCaloriesDays, getWeeklyWeightDelta } from './weeklyOverviewModel';

describe('getWeeklyCaloriesDays', () => {
    it('projects the local Monday-through-Sunday week with future days hidden', () => {
        const today = new Date(2026, 9, 14, 15, 30);
        const rangeCalls: [Date, Date][] = [];
        const days = getWeeklyCaloriesDays(today, (start, end) => {
            rangeCalls.push([start, end]);
            return [
                { date: '2026-10-12', calories: 1800 },
                { date: '2026-10-13', calories: 0 },
                { date: '2026-10-14', calories: 2200 },
                { date: '2026-10-15', calories: 900 },
            ];
        });

        expect(rangeCalls).toHaveLength(1);
        expect(rangeCalls[0][0]).toEqual(new Date(2026, 9, 12, 0, 0, 0, 0));
        expect(rangeCalls[0][1]).toEqual(new Date(2026, 9, 14, 23, 59, 59, 999));
        expect(days).toHaveLength(7);
        expect(days.map(day => day.dateKey)).toEqual([
            '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
            '2026-10-16', '2026-10-17', '2026-10-18',
        ]);
        expect(days.map(day => day.calories)).toEqual([1800, 0, 2200, null, null, null, null]);
        expect(days.map(day => day.dayLabel)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
        expect(days.filter(day => day.isToday).map(day => day.dateKey)).toEqual(['2026-10-14']);
        expect(days.filter(day => day.isFuture).map(day => day.dateKey)).toEqual([
            '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
        ]);
        expect(today).toEqual(new Date(2026, 9, 14, 15, 30));
    });

    it('starts on Monday when today is Sunday', () => {
        const days = getWeeklyCaloriesDays(
            new Date(2026, 9, 18, 12),
            () => [],
        );

        expect(days[0].dateKey).toBe('2026-10-12');
        expect(days[6]).toMatchObject({ dateKey: '2026-10-18', isToday: true, isFuture: false });
    });
});

describe('getWeeklyWeightDelta', () => {
    const stats = {
        avgWeight: 79.2,
        prevAvgWeight: 80,
        daysLoggedWeight: 3,
    };

    it('returns a goal-aligned decrease after the minimum logged days', () => {
        expect(getWeeklyWeightDelta(stats, -1)).toEqual({
            text: '0.8',
            icon: 'arrow-down',
            bg: colors.faded.successAlt,
            fg: colors.accent.success,
        });
    });

    it('uses neutral colors when the change does not align with the goal', () => {
        expect(getWeeklyWeightDelta({ ...stats, avgWeight: 80.8 }, -1)).toEqual({
            text: '0.8',
            icon: 'arrow-up',
            bg: colors.faded.surface,
            fg: colors.text.secondary,
        });
    });

    it('omits the delta when there are too few measurements, missing averages, or no rounded change', () => {
        expect(getWeeklyWeightDelta({ ...stats, daysLoggedWeight: 2 }, -1)).toBeNull();
        expect(getWeeklyWeightDelta({ ...stats, avgWeight: null }, -1)).toBeNull();
        expect(getWeeklyWeightDelta({ ...stats, avgWeight: 80.04 }, -1)).toBeNull();
    });
});
