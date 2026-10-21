import { renderHook } from '@testing-library/react-native';
import { calculate1RM } from '../../../workout/utils/workoutMetrics';
import {
    buildWeeks,
    dirOf,
    energyModel,
    liftSpan,
    liftStats,
    monthsModel,
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
    it('composes the existing progress engine calculations and defaults to the 12-week range', () => {
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
        const expectedRanges = rangeOptions(expectedInfo);
        const expectedRange = expectedRanges.find(option => option.key === '12W');

        expect(current.weeks).toEqual(expectedWeeks);
        expect(current.info).toEqual(expectedInfo);
        expect(current.ranges).toEqual(expectedRanges);
        expect(current.range).toEqual(expectedRange);
        expect(current.n).toBe(12);
        expect(current.pace).toEqual(paceModel(expectedWeeks, 12, expectedInfo));
        expect(current.energy).toEqual(energyModel(expectedWeeks, 12, expectedInfo, undefined));
        expect(current.strength).toEqual(strengthModel(expectedWeeks, expectedBuilt.lifts, 12));
        expect(current.lifts).toEqual(liftStats(expectedWeeks, expectedBuilt.lifts, liftSpan(expectedInfo)));
        expect(current.recap).toEqual(phaseRecap(undefined, expectedWeeks, expectedInfo, current.energy, null));
        expect(current.sets).toEqual(setsModel(expectedWeeks, 12));
        expect(current.months).toEqual(monthsModel(expectedWeeks, null));
    });

    it('updates to the requested range and falls back to 12 weeks for unknown keys', () => {
        const params = createParams();
        const { result, rerender } = renderHook(
            ({ rangeKey }: { rangeKey: string | null }) =>
                useProgressScreenModel({ ...params, rangeKey }),
            { initialProps: { rangeKey: '8W' } },
        );
        expect(result.current.range).toEqual({ key: '8W', label: '8 wk', n: 8 });
        expect(result.current.n).toBe(8);

        rerender({ rangeKey: 'missing' });
        const unknown = result.current;
        expect(unknown.range).toEqual({ key: '12W', label: '12 wk', n: 12 });
        expect(unknown.n).toBe(12);
    });
});
