import { buildWorkoutScheduleDisplay } from './workoutScheduleDisplay';

describe('buildWorkoutScheduleDisplay', () => {
    it('projects today and the next four scheduled workouts in date order', () => {
        const display = buildWorkoutScheduleDisplay({
            schedule: {
                monday: {
                    templateName: 'Push',
                    duration: 30,
                    exercises: [{ exerciseName: 'Press' }],
                },
                tuesday: {
                    templateName: 'Pull',
                    exercises: [{ exerciseName: 'Row' }],
                },
                wednesday: { templateName: 'Rest Day', exercises: [] },
                thursday: {
                    templateName: 'Legs',
                    duration: 60,
                    exercises: [{ exerciseName: 'Squat' }],
                },
                friday: { templateName: 'Rest Day', exercises: [] },
                saturday: {
                    templateName: 'Upper',
                    exercises: [{ exerciseName: 'Press' }],
                },
                sunday: {
                    templateName: 'Lower',
                    exercises: [{ exerciseName: 'Squat' }],
                },
            },
        }, new Date(2026, 9, 12));

        expect(display.todayWorkout).toEqual({
            name: 'Push',
            duration: '30 min',
            exercises: [{ exerciseName: 'Press' }],
        });
        expect(display.upcomingWorkouts.map(workout => [workout.name, workout.day])).toEqual([
            ['Pull', 'Tue'],
            ['Legs', 'Thu'],
            ['Upper', 'Sat'],
            ['Lower', 'Sun'],
        ]);
        expect(display.upcomingWorkouts[0]?.duration).toBe('45 min');
    });

    it('uses the default current-day workout name and duration and skips rest days', () => {
        const display = buildWorkoutScheduleDisplay({
            schedule: {
                monday: { exercises: [{ exerciseName: 'Press' }] },
                tuesday: { templateName: 'Rest Day', exercises: [] },
            },
        }, new Date(2026, 9, 12));

        expect(display.todayWorkout).toEqual({
            name: 'Workout',
            duration: '45 min',
            exercises: [{ exerciseName: 'Press' }],
        });
        expect(display.upcomingWorkouts.map(workout => workout.day)).toEqual(['Mon']);
        expect(display.upcomingWorkouts[0]).toMatchObject({
            name: 'Workout',
            duration: '45 min',
            exercises: [{ exerciseName: 'Press' }],
        });
    });

    it('returns empty display data when no split is active', () => {
        expect(buildWorkoutScheduleDisplay(null, new Date(2026, 9, 12))).toEqual({
            todayWorkout: null,
            upcomingWorkouts: [],
        });
    });
});
