import { buildWeeklyGroups, formatWeekLabel, formatWeightDate, getWeightGoalProgressPercent } from './weightTrackerPresentation';
import type { WeightInWeek } from '../../../../shared/types';

describe('buildWeeklyGroups', () => {
    it('sorts weeks newest first and derives trends from displayed averages', () => {
        const weightIns: WeightInWeek[] = [
            { weekStart: '2026-10-05', average: 70.04 },
            { weekStart: '2026-10-12', average: 69.96 },
        ];

        expect(buildWeeklyGroups(weightIns).map(({ weekStart, average, trend }) => ({
            weekStart, average, trend,
        }))).toEqual([
            { weekStart: '2026-10-12', average: 69.96, trend: 0 },
            { weekStart: '2026-10-05', average: 70.04, trend: null },
        ]);
        expect(weightIns.map(week => week.weekStart)).toEqual(['2026-10-05', '2026-10-12']);
    });

    it('builds ordered day entries and counts only logged days', () => {
        const groups = buildWeeklyGroups([{
            weekStart: '2026-10-12',
            days: { monday: 70, wednesday: '69.8', sunday: 69.5 },
        }]);

        expect(groups[0]).toMatchObject({
            daysLogged: 3,
            days: [
                { key: 'monday', weight: 70, date: new Date(2026, 9, 12) },
                { key: 'wednesday', weight: 69.8, date: new Date(2026, 9, 14) },
                { key: 'sunday', weight: 69.5, date: new Date(2026, 9, 18) },
            ],
        });
    });

    it('returns no groups for empty data', () => {
        expect(buildWeeklyGroups([])).toEqual([]);
    });
});

describe('formatWeekLabel', () => {
    it('formats a week start as a localized month and day', () => {
        expect(formatWeekLabel('2026-10-12')).toBe(
            new Date(2026, 9, 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        );
    });
});

describe('formatWeightDate', () => {
    it('falls back to today for invalid dates', () => {
        expect(formatWeightDate(new Date(Number.NaN))).toBe('Today');
    });

    describe('getWeightGoalProgressPercent', () => {
        it('counts progress toward weight-loss and weight-gain goals only', () => {
            expect(getWeightGoalProgressPercent(65, 70, 60)).toBe(50);
            expect(getWeightGoalProgressPercent(75, 70, 80)).toBe(50);
            expect(getWeightGoalProgressPercent(80, 70, 60)).toBe(0);
            expect(getWeightGoalProgressPercent(60, 70, 80)).toBe(0);
        });

        it('clamps progress at the goal and handles missing or equal weights', () => {
            expect(getWeightGoalProgressPercent(55, 70, 60)).toBe(100);
            expect(getWeightGoalProgressPercent(75, 70, 70)).toBe(100);
            expect(getWeightGoalProgressPercent(null, 70, 60)).toBe(0);
        });
    });

    it('formats dates that are neither today nor yesterday', () => {
        const date = new Date(2026, 9, 12);
        expect(formatWeightDate(date)).toBe(
            date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        );
    });
});
