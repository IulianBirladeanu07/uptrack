import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';

import { workoutService } from '../../services/WorkoutService';
import { sendWorkoutDataToFirestore } from '../../services/workoutSessionService';
import { workoutTimer } from '../../services/WorkoutTimerService';
import type { PersistedWorkoutState, WorkoutExercise } from '../../types';
import { useWorkoutSessionActions } from './useWorkoutSessionActions';

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
}));
jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));
jest.mock('../../services/WorkoutService', () => ({
    workoutService: {
        uid: 'user-1',
        getExerciseData: jest.fn(),
        areAllSetsValidated: jest.fn(),
        getWorkoutTemplateName: jest.fn(),
        clearWorkout: jest.fn(),
    },
}));
jest.mock('../../services/workoutSessionService', () => ({
    sendWorkoutDataToFirestore: jest.fn(),
}));
jest.mock('../../services/WorkoutTimerService', () => ({
    workoutTimer: {
        stop: jest.fn(),
        getFormattedTime: jest.fn(() => '1:00'),
        getElapsed: jest.fn(() => 60),
    },
}));

type SessionNavigation = {
    navigate: jest.Mock;
    goBack: jest.Mock;
};

const exercise: WorkoutExercise = {
    exerciseName: 'Bench Press',
    sets: [{
        id: 'set-1',
        weight: '50',
        reps: '8',
        isValidated: true,
        repsModified: false,
    }],
    lastWorkoutSets: [{
        id: 'last-1',
        weight: '45',
        reps: '8',
        isValidated: true,
        repsModified: false,
    }],
};

const makeOptions = () => ({
    inputText: 'Session note',
    navigation: {
        navigate: jest.fn(),
        goBack: jest.fn(),
    } as unknown as SessionNavigation,
    refreshAllData: jest.fn(async () => undefined),
    setActiveWorkout: jest.fn<(workout: PersistedWorkoutState | null) => void>(),
    setInputText: jest.fn<(note: string) => void>(),
    openAnimatedMessage: jest.fn(),
    initializationGeneration: { current: 1 },
    isFinishingWorkout: { current: false },
});

describe('useWorkoutSessionActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([exercise]);
        (workoutService.areAllSetsValidated as jest.Mock).mockReturnValue(true);
        (workoutService.getWorkoutTemplateName as jest.Mock).mockReturnValue('Upper Body');
        (workoutService.clearWorkout as jest.Mock).mockResolvedValue(undefined);
        (sendWorkoutDataToFirestore as jest.Mock).mockResolvedValue(true);
        workoutService.uid = 'user-1';
    });

    it('saves and clears the active session after successful completion', async () => {
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionActions(options));

        await act(async () => {
            await result.current.handleFinishWorkout();
        });

        expect(sendWorkoutDataToFirestore).toHaveBeenCalledWith(
            [expect.objectContaining({
                exerciseName: 'Bench Press',
                sets: [expect.objectContaining({ id: 'set-1' })],
                lastWorkoutSets: [expect.objectContaining({ id: 'last-1' })],
            })],
            'Session note',
            true,
            options.navigation,
            options.openAnimatedMessage,
            expect.any(Function),
            60,
            'user-1',
            'Upper Body',
        );
        expect(workoutTimer.stop).toHaveBeenCalledTimes(1);
        expect(workoutService.clearWorkout).toHaveBeenCalledTimes(1);
        expect(options.setActiveWorkout).toHaveBeenCalledWith(null);
        expect(options.setInputText).toHaveBeenCalledWith('');
        expect(options.refreshAllData).toHaveBeenCalledWith(true);
        expect(options.initializationGeneration.current).toBe(2);
        expect(options.isFinishingWorkout.current).toBe(false);
    });

    it('does not clear the session if saving is cancelled or fails', async () => {
        (sendWorkoutDataToFirestore as jest.Mock).mockResolvedValue(false);
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionActions(options));

        await act(async () => {
            await result.current.handleFinishWorkout();
        });

        expect(workoutService.clearWorkout).not.toHaveBeenCalled();
        expect(options.setActiveWorkout).not.toHaveBeenCalled();
        expect(options.isFinishingWorkout.current).toBe(false);
    });

    it('requires exercises and the matching signed-in user before saving', async () => {
        (workoutService.getExerciseData as jest.Mock).mockReturnValue([]);
        const options = makeOptions();
        const { result, rerender } = renderHook((props: typeof options) => useWorkoutSessionActions(props), {
            initialProps: options,
        });

        await act(async () => {
            await result.current.handleFinishWorkout();
        });
        expect(options.openAnimatedMessage).toHaveBeenCalledWith('Add exercises to finish workout');
        expect(sendWorkoutDataToFirestore).not.toHaveBeenCalled();

        (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'different-user' } });
        rerender(options);
        await act(async () => {
            await result.current.handleFinishWorkout();
        });
        expect(options.openAnimatedMessage).toHaveBeenCalledWith(
            'Unable to finish this workout because the signed-in account changed.',
        );
        expect(sendWorkoutDataToFirestore).not.toHaveBeenCalled();
    });

    it('does not start duplicate finish operations', async () => {
        let resolveSave: ((saved: boolean) => void) | undefined;
        (sendWorkoutDataToFirestore as jest.Mock).mockImplementation(
            () => new Promise(resolve => {
                resolveSave = resolve;
            }),
        );
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionActions(options));

        let pending: Promise<void> | undefined;
        act(() => {
            pending = result.current.handleFinishWorkout();
        });
        await act(async () => {
            await result.current.handleFinishWorkout();
        });
        expect(sendWorkoutDataToFirestore).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveSave?.(false);
            await pending;
        });
    });

    it('asks for exit confirmation and clears the matching user session when confirmed', async () => {
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionActions(options));

        act(() => result.current.handleExit());
        expect(Alert.alert).toHaveBeenCalledWith(
            'Exit Workout',
            'Are you sure you want to exit the workout?',
            expect.any(Array),
        );

        const alertActions = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as Array<{
            text: string;
            onPress?: () => void | Promise<void>;
        }>;
        await act(async () => {
            await alertActions.find(action => action.text === 'YES')?.onPress?.();
        });

        expect(workoutTimer.stop).toHaveBeenCalledTimes(1);
        expect(workoutService.clearWorkout).toHaveBeenCalledTimes(1);
        expect(options.setActiveWorkout).toHaveBeenCalledWith(null);
        expect(options.setInputText).toHaveBeenCalledWith('');
        expect(options.refreshAllData).toHaveBeenCalledWith(true);
        expect(options.navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('reports completion errors and releases the finishing guard', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        (sendWorkoutDataToFirestore as jest.Mock).mockRejectedValue(new Error('offline'));
        const options = makeOptions();
        const { result } = renderHook(() => useWorkoutSessionActions(options));

        await act(async () => {
            await result.current.handleFinishWorkout();
        });

        expect(consoleError).toHaveBeenCalledWith('Error finishing workout:', 'offline');
        expect(Alert.alert).toHaveBeenCalledWith(
            'Error',
            'An error occurred while finishing the workout.',
            [{ text: 'OK' }],
        );
        expect(options.isFinishingWorkout.current).toBe(false);
        consoleError.mockRestore();
    });
});
