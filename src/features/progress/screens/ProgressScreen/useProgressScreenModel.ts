import { useMemo } from 'react';
import { calculate1RM } from '../../../workout/utils/workoutMetrics';
import type { UserData } from '../../../../shared/types';
import type { BuildSource } from '../../utils/progressEngine';
import {
    MAX_WEEKS,
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

type ProgressScreenModelParams = {
    userData: UserData | null | undefined;
    workoutHistory: BuildSource['workouts'];
    getNutrition: NonNullable<BuildSource['getNutrition']>;
    getSteps: NonNullable<BuildSource['getSteps']>;
    rollingWeekStats: unknown;
    rangeKey: string | null;
    planned: number | null;
};

export const useProgressScreenModel = ({
    userData,
    workoutHistory,
    getNutrition,
    getSteps,
    rollingWeekStats,
    rangeKey,
    planned,
}: ProgressScreenModelParams) => {
    const dir = dirOf(userData?.weightChangePlan?.type);

    const built = useMemo(
        () => buildWeeks({
            weightIns: userData?.weightIns,
            weeklyNutrition: userData?.weeklyNutrition,
            dailySteps: userData?.dailySteps,
            workouts: workoutHistory,
            getNutrition,
            getSteps,
            calc1RM: calculate1RM,
        }),
        [userData?.weightIns, userData?.weeklyNutrition, userData?.dailySteps, workoutHistory, getNutrition, getSteps, rollingWeekStats],
    );

    const weeks = useMemo(() => withRates(built.weeks, dir), [built, dir]);
    const info = useMemo(() => phaseInfo(userData, weeks), [userData, weeks]);
    const ranges = useMemo(() => rangeOptions(info), [info]);
    const range = ranges.find(option => option.key === rangeKey) ?? ranges.find(option => option.key === 'PHASE') ?? ranges.find(option => option.key === '12W')!;
    const n = range.n;

    const pace = useMemo(() => paceModel(weeks, n, info), [weeks, n, info]);
    const energy = useMemo(() => energyModel(weeks, n, info, userData?.weightIns), [weeks, n, info, userData?.weightIns]);
    const strength = useMemo(() => strengthModel(weeks, built.lifts, n), [weeks, built.lifts, n]);
    const lifts = useMemo(() => liftStats(weeks, built.lifts, liftSpan(info)), [weeks, built.lifts, info]);
    const phaseStrength = useMemo(
        () => (info.reached && info.dir !== 0 ? strengthModel(weeks, built.lifts, Math.min(info.phaseWeeks, MAX_WEEKS)) : null),
        [weeks, built.lifts, info],
    );
    const recap = useMemo(() => phaseRecap(userData, weeks, info, energy, phaseStrength), [userData, weeks, info, energy, phaseStrength]);
    const sets = useMemo(() => setsModel(weeks, n), [weeks, n]);
    const months = useMemo(() => monthsModel(weeks, planned), [weeks, planned]);

    return {
        weeks,
        info,
        ranges,
        range,
        n,
        pace,
        energy,
        strength,
        lifts,
        recap,
        sets,
        months,
    };
};
