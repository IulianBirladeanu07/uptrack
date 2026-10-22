import { formatLocalDateKey } from '../../../../shared/utils/localDateKey';
import { colors } from '../../../../shared/theme';
import type { FoodContextValue } from '../../../nutrition/context/FoodContext';

const MIN_DELTA_DAYS = 3;

export type WeeklyCaloriesDay = {
    dateKey: string;
    dayLabel: string;
    calories: number | null;
    isToday: boolean;
    isFuture: boolean;
};

export type WeeklyWeightDelta = {
    text: string;
    icon: 'arrow-down' | 'arrow-up';
    bg: string;
    fg: string;
};

const toLocalDateKey = (date: Date): string => formatLocalDateKey(date);

const getMonday = (date: Date): Date => {
    const monday = new Date(date);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

export const getWeeklyCaloriesDays = (
    today: Date,
    getCaloriesForDateRange: FoodContextValue['getCaloriesForDateRange'],
): WeeklyCaloriesDay[] => {
    const monday = getMonday(today);
    const todayKey = toLocalDateKey(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const caloriesByDate: Record<string, number> = {};
    getCaloriesForDateRange(monday, todayEnd).forEach(day => {
        caloriesByDate[day.date] = day.calories;
    });

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const dateKey = toLocalDateKey(date);
        const isFuture = dateKey > todayKey;
        return {
            dateKey,
            dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: isFuture ? null : (caloriesByDate[dateKey] || 0),
            isToday: dateKey === todayKey,
            isFuture,
        };
    });
};

export const getWeeklyWeightDelta = (
    rollingStats: Pick<FoodContextValue['rollingWeekStats'], 'avgWeight' | 'prevAvgWeight' | 'daysLoggedWeight'>,
    goalDir: number,
): WeeklyWeightDelta | null => {
    const { avgWeight, prevAvgWeight, daysLoggedWeight } = rollingStats;
    if (
        avgWeight == null ||
        prevAvgWeight == null ||
        (daysLoggedWeight !== undefined && daysLoggedWeight < MIN_DELTA_DAYS)
    ) return null;
    const rounded = Math.round((avgWeight - prevAvgWeight) * 10) / 10;
    if (rounded === 0) return null;
    const aligned = goalDir !== 0 && Math.sign(rounded) === goalDir;
    return {
        text: Math.abs(rounded).toFixed(1),
        icon: rounded < 0 ? 'arrow-down' : 'arrow-up',
        bg: aligned ? colors.faded.successAlt : colors.faded.surface,
        fg: aligned ? colors.accent.success : colors.text.secondary,
    };
};
