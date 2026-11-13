export type WorkoutDetailsEntryMode = 'completion' | 'story';

export const getWorkoutDetailsEntryMode = (previousRouteName?: string): WorkoutDetailsEntryMode =>
    previousRouteName === 'StartWorkout' ? 'completion' : 'story';

export const getWorkoutDetailsBackCount = (previousRouteName?: string): number =>
    previousRouteName === 'StartWorkout' ? 2 : 1;
