import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useLearningCompletion } from './useLearningCompletion';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

describe('useLearningCompletion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports learning progress and caps completed progress at 100%', () => {
    const { result, rerender } = renderHook(
      ({ learningData, hasTargets }) => useLearningCompletion(learningData, hasTargets),
      { initialProps: { learningData: { daysLogged: 3 } as never, hasTargets: false } },
    );
    expect(result.current).toMatchObject({
      isLearning: true,
      isComplete: false,
      justCompleted: false,
      daysRemaining: 4,
    });
    expect(result.current.progress).toBeCloseTo(300 / 7);

    rerender({ learningData: { daysLogged: 9 } as never, hasTargets: true });
    expect(result.current).toMatchObject({
      isLearning: false,
      isComplete: true,
      daysRemaining: 0,
      progress: 100,
    });
  });

  it('announces completion after learning and resets completion after acknowledgement', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ learningData, hasTargets }) => useLearningCompletion(learningData, hasTargets),
      { initialProps: { learningData: { daysLogged: 6, weeklyAvgCalories: 2100 } as never, hasTargets: false } },
    );
    rerender({ learningData: { daysLogged: 7, weeklyAvgCalories: 2100 } as never, hasTargets: true });

    expect(result.current.justCompleted).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Learning Complete! 🎉',
      expect.stringContaining('Calories: 2100'),
      expect.any(Array),
      { cancelable: false },
    );
    const onPress = (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress;
    act(() => onPress());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.justCompleted).toBe(false);

    rerender({ learningData: { daysLogged: 0 } as never, hasTargets: false });
    expect(result.current.isLearning).toBe(true);
    jest.useRealTimers();
  });

  it('does not announce completion if targets were never absent with learning data', () => {
    const { result } = renderHook(() =>
      useLearningCompletion({ daysLogged: 7 } as never, true),
    );
    expect(result.current.isComplete).toBe(true);
    expect(result.current.justCompleted).toBe(false);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
