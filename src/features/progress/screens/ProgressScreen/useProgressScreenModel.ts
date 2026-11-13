import { useMemo } from 'react';
import { calculate1RM } from '../../../workout/utils/workoutMetrics';
import type { UserData } from '../../../../shared/types';
import type { BuildSource } from '../../utils/progressEngine';
import {
    MAX_WEEKS,
    addDays,
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

type ProgressScreenModelParams = {
    userData: UserData | null | undefined;
    workoutHistory: BuildSource['workouts'];
    getNutrition: NonNullable<BuildSource['getNutrition']>;
    getSteps: NonNullable<BuildSource['getSteps']>;
    nutritionHistoryStart?: BuildSource['nutritionHistoryStart'];
    rollingWeekStats: unknown;
    rangeKey: string | null;
    planned: number | null;
};

export const useProgressScreenModel = ({
    userData,
    workoutHistory,
    getNutrition,
    getSteps,
    nutritionHistoryStart,
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
            ...(nutritionHistoryStart !== undefined ? { nutritionHistoryStart } : {}),
            calc1RM: calculate1RM,
        }),
        [userData?.weightIns, userData?.weeklyNutrition, userData?.dailySteps, workoutHistory, getNutrition, getSteps, nutritionHistoryStart, rollingWeekStats],
    );

    const weeks = useMemo(() => withRates(built.weeks, dir), [built, dir]);
    const info = useMemo(() => phaseInfo(userData, weeks), [userData, weeks]);
    const phasePaceWeeks = useMemo(() => {
        if (!info.phaseStart) return withRates(built.weeks, dir);
        const phaseWeek = mondayOf(info.phaseStart);
        const firstFullPhaseWeek = phaseWeek.getTime() < info.phaseStart.getTime()
            ? addDays(phaseWeek, 7)
            : phaseWeek;
        return withRates(built.weeks.filter(week => week.monday >= firstFullPhaseWeek), dir);
    }, [built.weeks, info.phaseStart, dir]);
    const ranges = useMemo(() => rangeOptions(info, weeks.length), [info, weeks.length]);
    const range = ranges.find(option => option.key === rangeKey) ?? ranges[0]!;
    const n = range.n;

    const paceWeeks = phasePaceWeeks.slice(-n);
    const paceAverages = paceWeeks
        .filter((week): week is typeof week & { w: number } => week.w != null)
        .map(week => ({ monday: week.monday, average: week.w, change: week.delta, gap: week.gap }));
    const pace = useMemo(() => paceModel(phasePaceWeeks, n, info), [phasePaceWeeks, n, info]);
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
        paceAverages,
        phaseWeekCount: phasePaceWeeks.length,
        phaseRatedWeeks: phasePaceWeeks.filter(week => week.rate != null).length,
        energy,
        strength,
        lifts,
        recap,
        sets,
        months,
    };
};
