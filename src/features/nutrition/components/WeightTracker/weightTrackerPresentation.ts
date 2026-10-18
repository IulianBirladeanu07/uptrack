import type { DayKey, WeightInWeek } from '../../../../shared/types';

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
