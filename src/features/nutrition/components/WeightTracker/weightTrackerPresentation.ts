import { formatLocalDateKey } from '../../../../shared/utils/localDateKey';
import type { DayKey, PlanType, WeightInWeek } from '../../../../shared/types';
import { isGoalReached } from '../../../profile/utils/weightTrendEngine';

export type DayEntry = { key: DayKey; weight: number; date: Date };
export type WeekGroup = {
    weekStart: string;
    average: number | null;
    days: DayEntry[];
    trend: number | null;
    daysLogged: number;
};

export const WEEK_DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const getWeightGoalProgressPercent = (
    currentWeight: number | null | undefined,
    startWeight: number | null | undefined,
    goalWeight: number | null | undefined,
): number => {
    if (currentWeight == null || startWeight == null || goalWeight == null) return 0;
    const totalChange = goalWeight - startWeight;
    if (totalChange === 0) return 100;
    return Math.min(Math.max(((currentWeight - startWeight) / totalChange) * 100, 0), 100);
};

export const isWeightGoalReached = (
    currentWeight: number | null | undefined,
    goalWeight: number | null | undefined,
    planType: PlanType,
): boolean => isGoalReached(currentWeight, goalWeight, 0, planType);

export const getWeightGoalRemaining = (
    currentWeight: number | null | undefined,
    goalWeight: number | null | undefined,
    planType: PlanType,
): number | null => {
    if (currentWeight == null || goalWeight == null) return null;
    if (isWeightGoalReached(currentWeight, goalWeight, planType)) return 0;
    if (planType === 'weight_loss') return Math.max(0, currentWeight - goalWeight);
    if (planType === 'muscle_gain') return Math.max(0, goalWeight - currentWeight);
    return Math.abs(currentWeight - goalWeight);
};

export const getWeightTrendTone = (
    delta: number,
    planType: PlanType,
    phaseKnown = true,
): 'favorable' | 'unfavorable' | 'neutral' => {
    if (!phaseKnown || planType === 'maintenance' || delta === 0) return 'neutral';
    const favorable = planType === 'muscle_gain' ? delta > 0 : delta < 0;
    return favorable ? 'favorable' : 'unfavorable';
};

export const isComparisonInCurrentGoalPhase = (
    weekStart: string,
    previousWeekStart: string | null | undefined,
    goalSwitchDate: string | null | undefined,
): boolean => {
    if (!previousWeekStart) return false;
    if (!goalSwitchDate) return true;

    const switchDate = new Date(goalSwitchDate);
    if (Number.isNaN(switchDate.getTime())) return false;
    const mondayOffset = (switchDate.getDay() + 6) % 7;
    switchDate.setDate(switchDate.getDate() - mondayOffset + 7);
    const firstFullPhaseWeek = formatLocalDateKey(switchDate);

    return weekStart >= firstFullPhaseWeek && previousWeekStart >= firstFullPhaseWeek;
};

export const buildWeeklyGroups = (weightIns: WeightInWeek[]): WeekGroup[] => {
    if (!weightIns?.length) return [];

    return [...weightIns]
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
        .map((week, idx, arr) => {
            const days = WEEK_DAYS
                .map((key, i) => {
                    const val = week.days?.[key];
                    if (val == null) return null;
                    const [y, m, d] = week.weekStart.split('-').map(Number);
                    const date = new Date(y, m - 1, d + i);
                    return {
                        key,
                        weight: parseFloat(String(val)),
                        date,
                    };
                })
                .filter((day): day is DayEntry => day != null);

            const prevWeek = arr[idx + 1];
            const weekAvgDisplay = week.average != null ? parseFloat(week.average.toFixed(1)) : null;
            const prevAvgDisplay = prevWeek?.average != null ? parseFloat(prevWeek.average.toFixed(1)) : null;
            const trend = (weekAvgDisplay != null && prevAvgDisplay != null)
                ? parseFloat((weekAvgDisplay - prevAvgDisplay).toFixed(1))
                : null;

            return {
                weekStart: week.weekStart,
                average: week.average ?? null,
                days,
                trend,
                daysLogged: days.length,
            };
        });
};

export const formatWeekLabel = (weekStart: string): string => {
    const [y, m, d] = weekStart.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatWeightDate = (date: Date): string => {
    const value = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    if (value.toDateString() === new Date().toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (value.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
