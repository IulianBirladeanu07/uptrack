import {
    buildWeekDayDisplay,
    countCompletedScheduledDays,
    countScheduledWorkoutDays,
    toScheduledWorkoutPreview,
} from './thisWeekSchedule';

describe('buildWeekDayDisplay', () => {
    it('returns Monday-first days with scheduled workout and completion state', () => {
        const days = buildWeekDayDisplay([1, 5], {
            monday: { templateName: 'Upper', exercises: [{ exerciseName: 'Row' }] },
            wednesday: { templateName: 'Empty', exercises: [] },
            friday: { exercises: [{ exerciseName: 'Legs' }] },
        }, 3);

        expect(days.map(day => ({
            key: day.key,
            short: day.short,
            hasWorkout: day.hasWorkout,
            done: day.done,
            isToday: day.isToday,
        }))).toEqual([
            { key: 'monday', short: 'Mon', hasWorkout: true, done: true, isToday: false },
            { key: 'tuesday', short: 'Tue', hasWorkout: false, done: false, isToday: false },
            { key: 'wednesday', short: 'Wed', hasWorkout: false, done: false, isToday: true },
            { key: 'thursday', short: 'Thu', hasWorkout: false, done: false, isToday: false },
            { key: 'friday', short: 'Fri', hasWorkout: true, done: true, isToday: false },
            { key: 'saturday', short: 'Sat', hasWorkout: false, done: false, isToday: false },
            { key: 'sunday', short: 'Sun', hasWorkout: false, done: false, isToday: false },
        ]);
        expect(days[0].workoutData?.templateName).toBe('Upper');
    });

    it('supports missing schedules and defaults today to the local weekday', () => {
        const days = buildWeekDayDisplay([], null);
        expect(days).toHaveLength(7);
        expect(days.filter(day => day.isToday)).toHaveLength(1);
        expect(days.some(day => day.hasWorkout)).toBe(false);
    });
});

describe('scheduled-day counts', () => {
    it('counts only scheduled workout days and only completed scheduled days', () => {
        const days = buildWeekDayDisplay([1, 2], {
            monday: { exercises: [{ exerciseName: 'Press' }] },
            tuesday: { exercises: [] },
            wednesday: { exercises: [{ exerciseName: 'Pull' }] },
        }, 4);

        expect(countCompletedScheduledDays(days)).toBe(1);
        expect(countScheduledWorkoutDays(days)).toBe(2);
    });
});

describe('scheduled workout previews', () => {
    it('maps the scheduled workout and preserves display defaults', () => {
        const day = buildWeekDayDisplay([], {
            monday: {
                templateName: 'Upper A',
                duration: 35,
                exercises: [{ exerciseName: 'Bench Press' }],
            },
        }, 2)[0];

        expect(toScheduledWorkoutPreview(day)).toEqual({
            name: 'Upper A',
            duration: '35 min',
            exercises: [{ exerciseName: 'Bench Press' }],
            day: 'Mon',
        });
    });

    it('uses the default name and duration when schedule values are absent or falsy', () => {
        const day = buildWeekDayDisplay([], {
            monday: { exercises: [{ exerciseName: 'Squat' }], duration: 0 },
        }, 2)[0];

        expect(toScheduledWorkoutPreview(day)).toEqual({
            name: 'Workout',
            duration: '45 min',
            exercises: [{ exerciseName: 'Squat' }],
            day: 'Mon',
        });
    });

    it('returns no preview when the schedule day has no workout data', () => {
        const day = buildWeekDayDisplay([], null, 2)[0];
        expect(toScheduledWorkoutPreview(day)).toBeNull();
    });
});
