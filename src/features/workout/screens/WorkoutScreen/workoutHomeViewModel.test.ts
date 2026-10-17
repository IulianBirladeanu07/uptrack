import type { UpcomingWorkout } from './ComingUpCard';
import type { WorkoutDisplayData } from './MainWorkoutCard';
import { buildWorkoutHomeViewModel } from './workoutHomeViewModel';

const workout = (name: string, isRest = false): UpcomingWorkout => ({
    name,
    duration: '45 min',
    exercises: [{ exerciseName: name }],
    day: 'Tue',
    isRest,
});

describe('buildWorkoutHomeViewModel', () => {
    it('uses today’s workout and lists the first three future workouts', () => {
        const todayWorkout: WorkoutDisplayData = {
            name: 'Today',
            duration: '30 min',
            exercises: [
                { exerciseName: 'Press' },
                { name: 'Row' },
                {},
            ],
        };
        const upcoming = [workout('A'), workout('B'), workout('C'), workout('D')];

        expect(buildWorkoutHomeViewModel(todayWorkout, upcoming)).toEqual({
            primaryWorkout: { workout: todayWorkout, isRestDay: false, isToday: true },
            allExercises: ['Press', 'Row', 'Exercise'],
            comingUpWorkouts: upcoming.slice(0, 3),
        });
    });

    it('uses the next scheduled workout on a rest day and omits it from Up Next', () => {
        const upcoming = [workout('Rest', true), workout('Next'), workout('Later')];

        expect(buildWorkoutHomeViewModel(null, upcoming)).toEqual({
            primaryWorkout: {
                workout: {
                    name: 'Next',
                    duration: '45 min',
                    exercises: [{ exerciseName: 'Next' }],
                    day: 'Tue',
                },
                isRestDay: false,
                isToday: false,
            },
            allExercises: ['Next'],
            comingUpWorkouts: upcoming.slice(1, 4),
        });
    });

    it('keeps rest-day state when no future workout is available', () => {
        expect(buildWorkoutHomeViewModel(null, [workout('Rest', true)])).toEqual({
            primaryWorkout: { workout: null, isRestDay: true, isToday: false },
            allExercises: [],
            comingUpWorkouts: [],
        });
    });

    it('does not treat a scheduled workout with no exercises as today’s workout', () => {
        expect(buildWorkoutHomeViewModel({
            name: 'Empty',
            duration: '45 min',
            exercises: [],
        }, [])).toMatchObject({
            primaryWorkout: { workout: null, isRestDay: true, isToday: false },
            allExercises: [],
            comingUpWorkouts: [],
        });
    });
});
