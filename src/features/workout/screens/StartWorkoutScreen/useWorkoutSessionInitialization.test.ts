import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getAuth } from 'firebase/auth';
import { workoutService } from '../../services/WorkoutService';
import { workoutTimer } from '../../services/WorkoutTimerService';
import type { WorkoutExercise } from '../../types';
import { useWorkoutSessionInitialization } from './useWorkoutSessionInitialization';

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
}));
jest.mock('../../services/WorkoutService', () => ({
    workoutService: {
        subscribe: jest.fn(() => jest.fn()),
        getStartTime: jest.fn(() => 100),
        getExerciseData: jest.fn(() => []),
        getWorkoutNote: jest.fn(() => ''),
        getWorkoutTemplateName: jest.fn(() => ''),
        areAllSetsValidated: jest.fn(() => false),
        loadWorkoutFromTemplate: jest.fn(),
        restoreWorkout: jest.fn(),
        startWorkout: jest.fn(),
        setWorkoutTemplateName: jest.fn(),
        setWorkoutNote: jest.fn(),
    },
}));
jest.mock('../../services/WorkoutTimerService', () => ({
    workoutTimer: {
        start: jest.fn(),
        restore: jest.fn(),
    },
}));

const exercise: WorkoutExercise = {
    exerciseName: 'Bench Press',
    sets: [],
};

const makeOptions = (selectedWorkout?: unknown) => ({
    selectedWorkout,
    setExerciseData: jest.fn(),
    setInputText: jest.fn(),
    setSelectedExercise: jest.fn(),
    setIsValidationPressed: jest.fn(),
    setActiveWorkout: jest.fn(),
    refreshAllData: jest.fn(),
});

describe('useWorkoutSessionInitialization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
        (workoutService.subscribe as jest.Mock).mockReturnValue(jest.fn());
        (workoutService.getStartTime as jest.Mock).mockReturnValue(100);
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([exercise]);
        (workoutService.getWorkoutNote as jest.Mock).mockReturnValue('Restored note');
        (workoutService.getWorkoutTemplateName as jest.Mock).mockReturnValue('Template');
        (workoutService.areAllSetsValidated as jest.Mock).mockReturnValue(false);
        (workoutService.loadWorkoutFromTemplate as jest.Mock).mockResolvedValue([exercise]);
        (workoutService.restoreWorkout as jest.Mock).mockResolvedValue(null);
    });

    it('starts a selected workout from its template and publishes the active session', async () => {
        const options = makeOptions({
            note: 'Keep controlled',
            templateName: 'Upper Body',
            exercises: [{ exerciseName: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }],
        });
        const { result } = renderHook(() => useWorkoutSessionInitialization(options));

        await waitFor(() => expect(result.current.isInitializing).toBe(false));

        expect(workoutService.startWorkout).toHaveBeenCalledTimes(1);
        expect(workoutService.setWorkoutTemplateName).toHaveBeenCalledWith('Upper Body');
        expect(workoutService.setWorkoutNote).toHaveBeenCalledWith('Keep controlled');
        expect(workoutService.loadWorkoutFromTemplate).toHaveBeenCalledWith([
            expect.objectContaining({ exerciseName: 'Bench Press' }),
        ]);
        expect(options.setInputText).toHaveBeenCalledWith('Keep controlled');
        expect(options.setExerciseData).toHaveBeenCalledWith([exercise]);
        expect(options.setSelectedExercise).toHaveBeenCalledWith('Bench Press');
        expect(options.setIsValidationPressed).toHaveBeenCalledWith(false);
        expect(workoutTimer.start).toHaveBeenCalledTimes(1);
        expect(options.setActiveWorkout).toHaveBeenCalledWith(expect.objectContaining({
            startTime: 100,
            templateName: 'Template',
            isActive: true,
        }));
        expect(options.refreshAllData).toHaveBeenCalledTimes(1);
    });

    it('restores a saved session and restores its timer', async () => {
        (workoutService.restoreWorkout as jest.Mock).mockResolvedValue({ startTime: 50 });
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionInitialization(options));

        await waitFor(() => expect(result.current.isInitializing).toBe(false));

        expect(workoutTimer.restore).toHaveBeenCalledWith(50);
        expect(options.setExerciseData).toHaveBeenCalledWith([exercise]);
        expect(options.setInputText).toHaveBeenCalledWith('Restored note');
        expect(workoutService.startWorkout).not.toHaveBeenCalled();
        expect(options.refreshAllData).toHaveBeenCalledTimes(1);
    });

    it('starts a new empty session if there is no saved workout', async () => {
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionInitialization(options));

        await waitFor(() => expect(result.current.isInitializing).toBe(false));

        expect(workoutService.startWorkout).toHaveBeenCalledTimes(1);
        expect(workoutTimer.start).toHaveBeenCalledTimes(1);
        expect(options.setInputText).toHaveBeenCalledWith('');
        expect(options.setExerciseData).toHaveBeenCalledWith([exercise]);
        expect(options.refreshAllData).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes and ignores results from initialization after unmount', async () => {
        let resolveTemplate: ((exercises: WorkoutExercise[]) => void) | undefined;
        (workoutService.loadWorkoutFromTemplate as jest.Mock).mockImplementation(
            () => new Promise(resolve => {
                resolveTemplate = resolve;
            }),
        );
        const options = makeOptions({ exercises: [exercise] });
        const unsubscribe = jest.fn();
        (workoutService.subscribe as jest.Mock).mockReturnValue(unsubscribe);
        const { unmount } = renderHook(() => useWorkoutSessionInitialization(options));

        await waitFor(() => expect(resolveTemplate).toBeDefined());
        unmount();
        await act(async () => {
            resolveTemplate?.([exercise]);
            await Promise.resolve();
        });

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(options.setExerciseData).not.toHaveBeenCalled();
        expect(options.refreshAllData).not.toHaveBeenCalled();
        expect(workoutTimer.start).not.toHaveBeenCalled();
    });
});
