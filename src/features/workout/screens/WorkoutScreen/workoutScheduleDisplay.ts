import { getCycleLength, getScheduledDay } from '../../utils/splitSchedule';
import type { SplitLike } from '../../utils/splitSchedule';
import type { ThisWeekScheduleDay } from './thisWeekSchedule';
import type { UpcomingWorkout } from './ComingUpCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type WorkoutScheduleDisplay = {
    todayWorkout: WorkoutDisplayData | null;
    upcomingWorkouts: UpcomingWorkout[];
};

export const buildWorkoutScheduleDisplay = (
    split: SplitLike,
    now: Date,
    rotationStartDate?: unknown,
): WorkoutScheduleDisplay => {
    if (!split) {
        return { todayWorkout: null, upcomingWorkouts: [] };
    }

    const todayData = getScheduledDay(split, now, rotationStartDate) as ThisWeekScheduleDay | null;
    const todayExercises = todayData?.exercises ?? [];
    const todayWorkout = todayData && todayExercises.length > 0 ? {
        name: todayData.templateName ?? 'Workout',
        duration: todayData.duration ? `${todayData.duration} min` : '45 min',
        exercises: todayExercises,
    } : null;

    const upcomingWorkouts: UpcomingWorkout[] = [];
    const horizon = Math.max(13, getCycleLength(split));
    for (let i = 1; i <= horizon && upcomingWorkouts.length < 4; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const scheduledDay = getScheduledDay(split, futureDate, rotationStartDate) as ThisWeekScheduleDay | null;
        const exercises = scheduledDay?.exercises ?? [];

        if (exercises.length > 0) {
            upcomingWorkouts.push({
                name: scheduledDay?.templateName ?? 'Workout',
                day: DAY_LABELS[futureDate.getDay()],
                exercises,
                duration: scheduledDay?.duration ? `${scheduledDay.duration} min` : '45 min',
                isRest: false,
            });
        }
    }

    return { todayWorkout, upcomingWorkouts };
};
