import {
    buildWeeklyGroups,
    formatWeekLabel,
    formatWeightDate,
    getWeightGoalProgressPercent,
    getWeightGoalRemaining,
    getWeightTrendTone,
    isComparisonInCurrentGoalPhase,
    isWeightGoalReached,
} from './weightTrackerPresentation';
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

        describe('weight goal status', () => {
            it('treats a weight-loss average at or below its target as reached', () => {
                expect(isWeightGoalReached(79.4, 79.5, 'weight_loss')).toBe(true);
                expect(getWeightGoalRemaining(79.4, 79.5, 'weight_loss')).toBe(0);
            });

            it('keeps a gain goal unreached until the average reaches the target', () => {
                expect(isWeightGoalReached(79.4, 79.5, 'muscle_gain')).toBe(false);
                expect(getWeightGoalRemaining(79.4, 79.5, 'muscle_gain')).toBeCloseTo(0.1);
            });

            it('returns no remaining amount without both weights', () => {
                expect(getWeightGoalRemaining(null, 79.5, 'weight_loss')).toBeNull();
            });
        });

        describe('getWeightTrendTone', () => {
            it('uses the phase direction to classify a weekly change', () => {
                expect(getWeightTrendTone(2, 'muscle_gain')).toBe('favorable');
                expect(getWeightTrendTone(2, 'weight_loss')).toBe('unfavorable');
            });

            it('keeps historical and maintenance changes neutral when direction is unknown', () => {
                expect(getWeightTrendTone(2, 'weight_loss', false)).toBe('neutral');
                expect(getWeightTrendTone(2, 'maintenance')).toBe('neutral');
            });
        });

        describe('isComparisonInCurrentGoalPhase', () => {
            it('only classifies full-week comparisons after the current phase switch', () => {
                const switchDate = '2026-10-08T12:00:00.000Z';
                expect(isComparisonInCurrentGoalPhase('2026-10-12', '2026-10-05', switchDate)).toBe(false);
                expect(isComparisonInCurrentGoalPhase('2026-10-19', '2026-10-12', switchDate)).toBe(true);
                expect(isComparisonInCurrentGoalPhase('2026-10-05', '2026-09-28', switchDate)).toBe(false);
            });

            it('uses the current plan for all history when there is no switch date', () => {
                expect(isComparisonInCurrentGoalPhase('2026-10-12', '2026-10-05', null)).toBe(true);
            });
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
