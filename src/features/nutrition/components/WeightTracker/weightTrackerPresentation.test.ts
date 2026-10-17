import { buildWeeklyGroups, formatWeekLabel } from './weightTrackerPresentation';
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
