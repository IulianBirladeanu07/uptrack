import { act, renderHook } from '@testing-library/react-native';
import type { WorkoutExercise } from '../../types';
import { useWorkoutKeyboardNavigation } from './useWorkoutKeyboardNavigation';

const createExercise = (exerciseName: string, setCount: number): WorkoutExercise => ({
    exerciseName,
    sets: Array.from({ length: setCount }, (_, index) => ({
        id: `${exerciseName}-${index}`,
        weight: '',
        reps: '',
        isValidated: false,
        repsModified: false,
    })),
});

describe('useWorkoutKeyboardNavigation', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('tracks valid focused inputs and scrolls the associated exercise into view', () => {
        const scrollToExercise = jest.fn();
        const { result } = renderHook(() => useWorkoutKeyboardNavigation({
            exerciseData: [createExercise('Bench Press', 2)],
            scrollToExercise,
        }));

        act(() => result.current.handleKeyboardChange(true, {
            type: 'weight',
            exerciseIndex: 0,
            index: 1,
        }));

        expect(result.current.isKeyboardVisible).toBe(true);
        expect(result.current.isKeyboardVisibleRef.current).toBe(true);
        expect(result.current.focusedInputData).toEqual({
            type: 'weight',
            exerciseIndex: 0,
            index: 1,
        });
        act(() => jest.advanceTimersByTime(100));
        expect(scrollToExercise).toHaveBeenCalledWith(0);
    });

    it('clears focus when keyboard input is hidden or invalid', () => {
        const { result } = renderHook(() => useWorkoutKeyboardNavigation({
            exerciseData: [],
            scrollToExercise: jest.fn(),
        }));

        act(() => result.current.handleKeyboardChange(true, {
            type: 'weight',
            exerciseIndex: 0,
            index: 0,
        }));
        expect(result.current.focusedInputData).not.toBeNull();

        act(() => result.current.handleKeyboardChange(false, null));
        expect(result.current.isKeyboardVisible).toBe(false);
        expect(result.current.isKeyboardVisibleRef.current).toBe(false);
        expect(result.current.focusedInputData).toBeNull();
    });

    it('advances from weight to reps, then to subsequent sets and exercises', () => {
        const scrollToExercise = jest.fn();
        const { result } = renderHook(() => useWorkoutKeyboardNavigation({
            exerciseData: [createExercise('Bench Press', 2), createExercise('Row', 1)],
            scrollToExercise,
        }));

        act(() => result.current.handleKeyboardChange(true, {
            type: 'weight',
            exerciseIndex: 0,
            index: 0,
        }));
        act(() => result.current.handleNext());
        expect(result.current.focusedInputData).toEqual({ type: 'reps', exerciseIndex: 0, index: 0 });

        act(() => result.current.handleNext());
        expect(result.current.focusedInputData).toEqual({ type: 'weight', exerciseIndex: 0, index: 1 });

        act(() => result.current.handleNext());
        expect(result.current.focusedInputData).toEqual({ type: 'reps', exerciseIndex: 0, index: 1 });

        act(() => result.current.handleNext());
        expect(result.current.focusedInputData).toEqual({ type: 'weight', exerciseIndex: 1, index: 0 });
        act(() => jest.advanceTimersByTime(100));
        expect(scrollToExercise).toHaveBeenCalledWith(1);
    });

    it('dismisses the keyboard after the final reps input', () => {
        const { result } = renderHook(() => useWorkoutKeyboardNavigation({
            exerciseData: [createExercise('Bench Press', 1)],
            scrollToExercise: jest.fn(),
        }));

        act(() => result.current.handleKeyboardChange(true, {
            type: 'reps',
            exerciseIndex: 0,
            index: 0,
        }));
        act(() => result.current.handleNext());

        expect(result.current.isKeyboardVisible).toBe(false);
        expect(result.current.isKeyboardVisibleRef.current).toBe(false);
        expect(result.current.focusedInputData).toBeNull();
    });

    it('dismisses focus explicitly', () => {
        const { result } = renderHook(() => useWorkoutKeyboardNavigation({
            exerciseData: [createExercise('Bench Press', 1)],
            scrollToExercise: jest.fn(),
        }));
        act(() => result.current.handleKeyboardChange(true, {
            type: 'reps',
            exerciseIndex: 0,
            index: 0,
        }));

        act(() => result.current.dismissKeyboard());

        expect(result.current.isKeyboardVisible).toBe(false);
        expect(result.current.isKeyboardVisibleRef.current).toBe(false);
        expect(result.current.focusedInputData).toBeNull();
    });
});
