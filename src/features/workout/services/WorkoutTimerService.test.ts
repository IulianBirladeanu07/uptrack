jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

import { workoutTimer } from './WorkoutTimerService';

describe('WorkoutTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    workoutTimer.stop();
  });

  afterEach(() => {
    workoutTimer.stop();
    jest.useRealTimers();
  });

  it('notifies current listeners when stopped and keeps them for the next workout', () => {
    const listener = jest.fn();
    const unsubscribe = workoutTimer.subscribe(listener);

    workoutTimer.start();
    jest.advanceTimersByTime(1000);
    expect(listener).toHaveBeenLastCalledWith(1);

    workoutTimer.stop();
    expect(listener).toHaveBeenLastCalledWith(0);
    expect(workoutTimer.getFormattedTime()).toBe('0:00');

    workoutTimer.start();
    jest.advanceTimersByTime(1000);
    expect(listener).toHaveBeenLastCalledWith(1);

    unsubscribe();
  });

  it('notifies current listeners immediately when restoring a workout', () => {
    const listener = jest.fn();
    const unsubscribe = workoutTimer.subscribe(listener);
    const startTime = Date.now() - 9000;

    workoutTimer.restore(startTime);

    expect(listener).toHaveBeenLastCalledWith(9);
    unsubscribe();
  });
});
