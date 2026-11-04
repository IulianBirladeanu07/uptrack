import { renderHook } from '@testing-library/react-native';
import { calculate1RM } from '../../../workout/utils/workoutMetrics';
import {
    buildWeeks,
    dirOf,
    energyModel,
    liftSpan,
    liftStats,
    monthsModel,
    mondayOf,
    paceModel,
    phaseInfo,
    phaseRecap,
    rangeOptions,
    setsModel,
    strengthModel,
    withRates,
} from '../../utils/progressEngine';
import { useProgressScreenModel } from './useProgressScreenModel';

const createParams = (overrides: Partial<Parameters<typeof useProgressScreenModel>[0]> = {}) => ({
    userData: undefined,
    workoutHistory: [],
    getNutrition: () => [],
    getSteps: () => [],
    rollingWeekStats: {},
    rangeKey: null,
    planned: null,
    ...overrides,
});

describe('useProgressScreenModel', () => {
    it('composes the existing progress engine calculations and defaults to the active phase range', () => {
        const params = createParams();
        const { result } = renderHook(() => useProgressScreenModel(params));
        const { current } = result;
        const dir = dirOf(undefined);
        const expectedBuilt = buildWeeks({
            weightIns: undefined,
            weeklyNutrition: undefined,
            dailySteps: undefined,
            workouts: [],
            getNutrition: params.getNutrition,
            getSteps: params.getSteps,
            calc1RM: calculate1RM,
        });
        const expectedWeeks = withRates(expectedBuilt.weeks, dir);
        const expectedInfo = phaseInfo(undefined, expectedWeeks);
        const expectedRanges = rangeOptions(expectedInfo, expectedWeeks.length);
        const expectedRange = expectedRanges.find(option => option.key === 'PHASE');

        expect(current.weeks).toEqual(expectedWeeks);
        expect(current.info).toEqual(expectedInfo);
        expect(current.ranges).toEqual(expectedRanges);
        expect(current.range).toEqual(expectedRange);
        expect(current.n).toBe(1);
        expect(current.pace).toEqual(paceModel(expectedWeeks, 1, expectedInfo));
        expect(current.paceAverages).toEqual([]);
        expect(current.energy).toEqual(energyModel(expectedWeeks, 1, expectedInfo, undefined));
        expect(current.strength).toEqual(strengthModel(expectedWeeks, expectedBuilt.lifts, 1));
        expect(current.lifts).toEqual(liftStats(expectedWeeks, expectedBuilt.lifts, liftSpan(expectedInfo)));
        expect(current.recap).toEqual(phaseRecap(undefined, expectedWeeks, expectedInfo, current.energy, null));
        expect(current.sets).toEqual(setsModel(expectedWeeks, 1));
        expect(current.months).toEqual(monthsModel(expectedWeeks, null));
    });

    it('falls back to the phase range when a requested history range is unavailable', () => {
        const params = createParams();
        const { result, rerender } = renderHook(
            ({ rangeKey }: { rangeKey: string | null }) =>
                useProgressScreenModel({ ...params, rangeKey }),
            { initialProps: { rangeKey: '8W' } },
        );
        expect(result.current.range).toEqual({ key: 'PHASE', label: 'Maintain', n: 1 });
        expect(result.current.n).toBe(1);

        rerender({ rangeKey: 'missing' });
        const unknown = result.current;
        expect(unknown.range).toEqual({ key: 'PHASE', label: 'Maintain', n: 1 });
        expect(unknown.n).toBe(1);
    });

    it('starts phase pace from the first full phase week and does not inherit the previous phase rate', () => {
        const currentMonday = mondayOf(new Date());
        const phaseStart = new Date(currentMonday);
        phaseStart.setDate(phaseStart.getDate() - 31);
        const weekStart = (offset: number) => {
            const date = new Date(currentMonday);
            date.setDate(date.getDate() + offset * 7);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const params = createParams({
            rangeKey: 'PHASE',
            userData: {
                goalSwitchDate: phaseStart.toISOString(),
                targetWeight: 110,
                weightChangePlan: {
                    type: 'muscle_gain',
                    ratePerWeek: 0.3,
                    ratePerMonth: 1.2,
                    goalCalories: 2500,
                    macros: { protein: 150, carbs: 250, fats: 70 },
                    bmr: 1800,
                    tdee: 2200,
                    weeksToGoal: 10,
                    estimatedDate: '',
                    isEstimate: false,
                },
                weightIns: [
                    { weekStart: weekStart(-5), average: 105 },
                    { weekStart: weekStart(-4), average: 90 },
                    { weekStart: weekStart(-3), average: 90.2 },
                    { weekStart: weekStart(-2), average: 90.4 },
                    { weekStart: weekStart(-1), average: 90.6 },
                ],
            },
        });
        const { result } = renderHook(() => useProgressScreenModel(params));

        expect(result.current.paceAverages.map(week => week.average)).toEqual([90, 90.2, 90.4, 90.6]);
        expect(result.current.pace?.slots
            .map(slot => slot.v)
            .filter((rate): rate is number => rate != null)
            .map(rate => Number(rate.toFixed(1)))).toEqual([0.2, 0.2, 0.2]);
    });
});
