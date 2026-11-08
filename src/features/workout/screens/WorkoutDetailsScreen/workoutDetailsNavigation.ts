export const getWorkoutDetailsBackCount = (previousRouteName?: string): number =>
    previousRouteName === 'StartWorkout' ? 2 : 1;
