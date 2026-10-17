import type { TemplateExercise } from '../../types';

export type ThisWeekScheduleDay = {
    templateName?: string;
    duration?: string | number;
    exercises?: TemplateExercise[];
};

export type WorkoutWeekSchedule = Record<string, ThisWeekScheduleDay | null | undefined>;

export type WeekDayDisplay = {
    key: string;
    jsDay: number;
    short: string;
    hasWorkout: boolean;
    workoutData: ThisWeekScheduleDay | null;
    done: boolean;
    isToday: boolean;
};

export type ScheduledWorkoutPreview = {
    name: string;
    duration: string;
    exercises: TemplateExercise[];
    day: string;
};

const WEEK_DAYS = [
    { key: 'monday', jsDay: 1 },
    { key: 'tuesday', jsDay: 2 },
    { key: 'wednesday', jsDay: 3 },
    { key: 'thursday', jsDay: 4 },
    { key: 'friday', jsDay: 5 },
    { key: 'saturday', jsDay: 6 },
    { key: 'sunday', jsDay: 0 },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const buildWeekDayDisplay = (
    completedDays: number[],
    schedule: WorkoutWeekSchedule | null,
    today = new Date().getDay(),
): WeekDayDisplay[] => WEEK_DAYS.map(day => {
    const workoutData = schedule?.[day.key] ?? null;
    const hasWorkout = (workoutData?.exercises?.length ?? 0) > 0;
    return {
        ...day,
        short: DAY_LABELS[day.jsDay],
        hasWorkout,
        workoutData,
        done: completedDays.includes(day.jsDay),
        isToday: day.jsDay === today,
    };
});

export const countCompletedScheduledDays = (days: WeekDayDisplay[]): number =>
    days.filter(day => day.done && day.hasWorkout).length;

export const countScheduledWorkoutDays = (days: WeekDayDisplay[]): number =>
    days.filter(day => day.hasWorkout).length;

export const toScheduledWorkoutPreview = (
    day: WeekDayDisplay,
): ScheduledWorkoutPreview | null => {
    if (!day.workoutData) return null;

    return {
        name: day.workoutData.templateName ?? 'Workout',
        duration: day.workoutData.duration ? `${day.workoutData.duration} min` : '45 min',
        exercises: day.workoutData.exercises ?? [],
        day: day.short,
    };
};
