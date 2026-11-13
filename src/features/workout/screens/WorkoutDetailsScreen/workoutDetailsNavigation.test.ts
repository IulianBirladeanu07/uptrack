import { getWorkoutDetailsBackCount, getWorkoutDetailsEntryMode } from './workoutDetailsNavigation';

describe('getWorkoutDetailsBackCount', () => {
    it('returns to the launching screen when details opened from history', () => {
        expect(getWorkoutDetailsBackCount('WorkoutHistory')).toBe(1);
    });

    it('returns to the workout screen after completion details', () => {
        expect(getWorkoutDetailsBackCount('StartWorkout')).toBe(2);
    });
});

describe('getWorkoutDetailsEntryMode', () => {
    it('shows the completion recap after finishing a workout', () => {
        expect(getWorkoutDetailsEntryMode('StartWorkout')).toBe('completion');
    });

    it('opens the story editor when viewing workout history', () => {
        expect(getWorkoutDetailsEntryMode('WorkoutHistory')).toBe('story');
    });
});
