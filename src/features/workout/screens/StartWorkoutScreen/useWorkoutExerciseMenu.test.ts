import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { workoutService } from '../../services/WorkoutService';
import type { WorkoutExercise } from '../../types';
import { useWorkoutExerciseMenu } from './useWorkoutExerciseMenu';

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));
jest.mock('../../services/WorkoutService', () => ({
    workoutService: {
        getExerciseData: jest.fn(),
        deleteExercise: jest.fn(),
        moveExercise: jest.fn(),
    },
}));

const createExercise = (name: string, validated = false): WorkoutExercise => ({
    exerciseName: name,
    sets: [{
        id: `${name}-set`,
        weight: '20',
        reps: '10',
        isValidated: validated,
        repsModified: false,
    }],
});

const makeOptions = (exerciseCount = 3) => ({
    exerciseCount,
    isKeyboardVisibleRef: { current: false },
    dismissKeyboard: jest.fn(),
    navigation: { navigate: jest.fn() } as never,
    markExerciseForReplacement: jest.fn(),
});

describe('useWorkoutExerciseMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([
            createExercise('Bench Press', true),
            createExercise('Row'),
            createExercise('Squat'),
        ]);
    });

    it('opens the menu and dismisses a visible custom keyboard', () => {
        const options = makeOptions();
        options.isKeyboardVisibleRef.current = true;
        const { result } = renderHook(() => useWorkoutExerciseMenu(options));

        act(() => result.current.handleMenuPress(createExercise('Row'), 1));

        expect(options.dismissKeyboard).toHaveBeenCalledTimes(1);
        expect(result.current.activeExerciseMenu).toEqual({
            exercise: createExercise('Row'),
            exerciseIndex: 1,
        });
    });

    it('deletes unvalidated exercises directly and confirms deletion of logged sets', () => {
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutExerciseMenu(options));

        act(() => result.current.handleMenuPress(createExercise('Bench Press'), 0));
        act(() => result.current.handleMenuDelete());

        expect(Alert.alert).toHaveBeenCalledWith(
            'Delete Exercise',
            'Delete Bench Press and its logged sets?',
            expect.any(Array),
        );
        const actions = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as Array<{
            text: string;
            onPress?: () => void;
        }>;
        act(() => actions.find(action => action.text === 'Delete')?.onPress?.());
        expect(workoutService.deleteExercise).toHaveBeenCalledWith(0);

        (workoutService.getExerciseData as jest.Mock).mockReturnValue([
            createExercise('Bench Press'),
            createExercise('Row'),
        ]);
        act(() => result.current.handleMenuPress(createExercise('Row'), 1));
        act(() => result.current.handleMenuDelete());
        expect(workoutService.deleteExercise).toHaveBeenCalledWith(1);
    });

    it('marks an exercise for replacement and navigates with its position', () => {
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutExerciseMenu(options));

        act(() => result.current.handleMenuPress(createExercise('Row'), 1));
        act(() => result.current.handleMenuReplace());

        expect(options.markExerciseForReplacement).toHaveBeenCalledWith(1);
        expect(options.navigation.navigate).toHaveBeenCalledWith('ExerciseSelection', {
            previousScreen: 'StartWorkout',
            replaceIndex: '1',
        });
    });

    it('moves within bounds and updates the active menu position', () => {
        const options = makeOptions(2);
        const { result } = renderHook(() => useWorkoutExerciseMenu(options));

        act(() => result.current.handleMenuPress(createExercise('Bench Press'), 0));
        expect(result.current.canMoveActiveExerciseUp).toBe(false);
        expect(result.current.canMoveActiveExerciseDown).toBe(true);

        act(() => result.current.handleMenuMoveUp());
        expect(workoutService.moveExercise).not.toHaveBeenCalled();
        act(() => result.current.handleMenuMoveDown());
        expect(workoutService.moveExercise).toHaveBeenCalledWith(0, 1);
        expect(result.current.activeExerciseMenu?.exerciseIndex).toBe(1);
        expect(result.current.canMoveActiveExerciseDown).toBe(false);

        act(() => result.current.handleMenuMoveDown());
        expect(workoutService.moveExercise).toHaveBeenCalledTimes(1);
    });

    it('invokes the note trigger registered for the selected exercise', () => {
        const { result } = renderHook(() => useWorkoutExerciseMenu(makeOptions()));
        const openNote = jest.fn();

        act(() => result.current.onAddNote.register(2, openNote));
        act(() => result.current.handleMenuPress(createExercise('Squat'), 2));
        act(() => result.current.handleMenuAddNote());

        expect(openNote).toHaveBeenCalledTimes(1);
    });
});
