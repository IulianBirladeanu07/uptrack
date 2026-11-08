import { getWorkoutDetailsBackCount } from './workoutDetailsNavigation';

describe('getWorkoutDetailsBackCount', () => {
    it('returns to the launching screen when details opened from history', () => {
        expect(getWorkoutDetailsBackCount('WorkoutHistory')).toBe(1);
    });

    it('returns to the workout screen after completion details', () => {
        expect(getWorkoutDetailsBackCount('StartWorkout')).toBe(2);
    });
});
