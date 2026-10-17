import { act, renderHook } from '@testing-library/react-native';
import { getAuth } from 'firebase/auth';
import { createEmptySet, workoutService } from '../../services/WorkoutService';
import type { WorkoutExercise } from '../../types';
import { useWorkoutExerciseSelection } from './useWorkoutExerciseSelection';

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
}));
jest.mock('../../services/WorkoutService', () => ({
    createEmptySet: jest.fn(() => ({
        id: 'empty-set',
        weight: '',
        reps: '',
        isValidated: false,
        repsModified: false,
    })),
    workoutService: {
        getExerciseData: jest.fn(),
        fetchLastSets: jest.fn(),
        addExercises: jest.fn(),
        replaceExercise: jest.fn(),
    },
}));

const makeExercise = (exerciseName: string, sets = 1): WorkoutExercise => ({
    exerciseName,
    muscleGroup: 'Chest',
    repRange: '8-12',
    sets: Array.from({ length: sets }, (_, index) => ({
        id: `set-${index}`,
        weight: '20',
        reps: '10',
        isValidated: false,
        repsModified: false,
    })),
});

describe('useWorkoutExerciseSelection', () => {
    const generation = { current: 1 };

    beforeEach(() => {
        jest.clearAllMocks();
        generation.current = 1;
        (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([]);
        (workoutService.fetchLastSets as jest.Mock).mockResolvedValue([]);
    });

    it('adds distinct selected exercises with a fresh set and selects the first new exercise', async () => {
        const setExerciseData = jest.fn();
        const setSelectedExercise = jest.fn();
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: null,
            setSelectedExercise,
            setExerciseData,
            openAnimatedMessage: jest.fn(),
        }));

        await act(async () => {
            await result.current.addNewExercisesFromRoute([
                { exerciseName: 'Bench Press', muscleGroup: 'Chest', repRange: '8-12' },
                { name: 'Bench Press', muscleGroup: 'Chest' },
                { exerciseName: 'Cable Fly', muscleGroup: 'Chest' },
            ]);
        });

        expect(workoutService.fetchLastSets).toHaveBeenCalledTimes(2);
        expect(workoutService.addExercises).toHaveBeenCalledWith([
            expect.objectContaining({
                exerciseName: 'Bench Press',
                muscleGroup: 'Chest',
                repRange: '8-12',
                sets: [createEmptySet()],
            }),
            expect.objectContaining({
                exerciseName: 'Cable Fly',
                muscleGroup: 'Chest',
                sets: [createEmptySet()],
            }),
        ]);
        expect(setExerciseData).toHaveBeenCalledWith([]);
        expect(setSelectedExercise).toHaveBeenCalledWith('Bench Press');
    });

    it('does not add exercises already present in the current workout', async () => {
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([makeExercise('Bench Press')]);
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: 'Bench Press',
            setSelectedExercise: jest.fn(),
            setExerciseData: jest.fn(),
            openAnimatedMessage: jest.fn(),
        }));

        await act(async () => {
            await result.current.addNewExercisesFromRoute([{ exerciseName: 'Bench Press' }]);
        });

        expect(workoutService.fetchLastSets).not.toHaveBeenCalled();
        expect(workoutService.addExercises).not.toHaveBeenCalled();
    });

    it('replaces the target while preserving set count and selected exercise state', async () => {
        const replaced = makeExercise('Bench Press', 3);
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([replaced]);
        const setExerciseData = jest.fn();
        const setSelectedExercise = jest.fn();
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: 'Bench Press',
            setSelectedExercise,
            setExerciseData,
            openAnimatedMessage: jest.fn(),
        }));

        await act(async () => {
            await result.current.replaceExerciseFromRoute(0, {
                exerciseName: 'Incline Press',
                muscleGroup: 'Chest',
                repRange: '6-10',
            });
        });

        expect(workoutService.fetchLastSets).toHaveBeenCalledWith('Incline Press', 'Chest');
        expect(workoutService.replaceExercise).toHaveBeenCalledWith(0, expect.objectContaining({
            exerciseName: 'Incline Press',
            repRange: '6-10',
            sets: [createEmptySet(), createEmptySet(), createEmptySet()],
        }));
        expect(setExerciseData).toHaveBeenCalledWith([replaced]);
        expect(setSelectedExercise).toHaveBeenCalledWith('Incline Press');
    });

    it('rejects replacements that duplicate another exercise', async () => {
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([
            makeExercise('Bench Press'),
            makeExercise('Incline Press'),
        ]);
        const openAnimatedMessage = jest.fn();
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: 'Bench Press',
            setSelectedExercise: jest.fn(),
            setExerciseData: jest.fn(),
            openAnimatedMessage,
        }));

        await act(async () => {
            await result.current.replaceExerciseFromRoute(0, { exerciseName: 'Incline Press' });
        });

        expect(openAnimatedMessage).toHaveBeenCalledWith('This exercise is already added.');
        expect(workoutService.fetchLastSets).not.toHaveBeenCalled();
        expect(workoutService.replaceExercise).not.toHaveBeenCalled();
    });

    it('ignores replacement results when the session generation changes during the fetch', async () => {
        let resolveLastSets: ((sets: WorkoutExercise['sets']) => void) | undefined;
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([makeExercise('Bench Press')]);
        (workoutService.fetchLastSets as jest.Mock).mockImplementation(
            () => new Promise(resolve => {
                resolveLastSets = resolve;
            }),
        );
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: 'Bench Press',
            setSelectedExercise: jest.fn(),
            setExerciseData: jest.fn(),
            openAnimatedMessage: jest.fn(),
        }));

        let pending: Promise<void> | undefined;
        act(() => {
            pending = result.current.replaceExerciseFromRoute(0, { exerciseName: 'Incline Press' });
        });
        generation.current++;
        await act(async () => {
            resolveLastSets?.([]);
            await pending;
        });

        expect(workoutService.replaceExercise).not.toHaveBeenCalled();
    });

    it('tracks and consumes a pending replacement index once', () => {
        const { result } = renderHook(() => useWorkoutExerciseSelection({
            initializationGeneration: generation,
            selectedExercise: null,
            setSelectedExercise: jest.fn(),
            setExerciseData: jest.fn(),
            openAnimatedMessage: jest.fn(),
        }));

        act(() => result.current.markExerciseForReplacement(2));
        expect(result.current.takePendingReplacement()).toBe(2);
        expect(result.current.takePendingReplacement()).toBeNull();
    });
});
