import { useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AuthenticatedStackParamList } from '../../../../shared/navigation';
import type { PersistedWorkoutState } from '../../types';
import { sendWorkoutDataToFirestore } from '../../services/workoutSessionService';
import { workoutService } from '../../services/WorkoutService';
import { workoutTimer } from '../../services/WorkoutTimerService';
import { isCurrentWorkoutUser } from './workoutUserGuard';

type AppNavigation = NativeStackNavigationProp<AuthenticatedStackParamList>;
type SessionNavigation = Pick<AppNavigation, 'navigate' | 'goBack'>;

type WorkoutSessionActionsOptions = {
    inputText: string;
    navigation: SessionNavigation;
    refreshAllData: (immediate?: boolean) => Promise<unknown>;
    setActiveWorkout: (workout: PersistedWorkoutState | null) => void;
    setInputText: (note: string) => void;
    openAnimatedMessage: (message: string) => void;
    initializationGeneration: { current: number };
    isFinishingWorkout: { current: boolean };
};

export const useWorkoutSessionActions = ({
    inputText,
    navigation,
    refreshAllData,
    setActiveWorkout,
    setInputText,
    openAnimatedMessage,
    initializationGeneration,
    isFinishingWorkout,
}: WorkoutSessionActionsOptions) => {
    const confirmExit = useCallback(async (uid: string) => {
        if (!isCurrentWorkoutUser(uid) || workoutService.uid !== uid) return;
        initializationGeneration.current++;
        workoutTimer.stop();
        await workoutService.clearWorkout();
        if (!isCurrentWorkoutUser(uid) || workoutService.uid !== uid) return;
        setActiveWorkout(null);
        setInputText('');
        await refreshAllData(true);
        if (!isCurrentWorkoutUser(uid) || workoutService.uid !== uid) return;
        navigation.goBack();
    }, [initializationGeneration, navigation, refreshAllData, setActiveWorkout, setInputText]);

    const handleExit = useCallback(() => {
        if (isFinishingWorkout.current) return;
        const uid = getAuth().currentUser?.uid;
        if (!uid || workoutService.uid !== uid) return;
        Alert.alert('Exit Workout', 'Are you sure you want to exit the workout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'YES', onPress: () => confirmExit(uid) },
        ]);
    }, [confirmExit, isFinishingWorkout]);

    const handleFinishWorkout = useCallback(async () => {
        if (isFinishingWorkout.current) return;
        const uid = getAuth().currentUser?.uid;
        if (!uid || workoutService.uid !== uid) {
            openAnimatedMessage('Unable to finish this workout because the signed-in account changed.');
            return;
        }
        const currentExerciseData = workoutService.getExerciseData().map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({ ...set })),
            ...(exercise.lastWorkoutSets
                ? { lastWorkoutSets: exercise.lastWorkoutSets.map(set => ({ ...set })) }
                : {}),
        }));
        if (currentExerciseData.length === 0) {
            openAnimatedMessage('Add exercises to finish workout');
            return;
        }

        try {
            isFinishingWorkout.current = true;
            const result = await sendWorkoutDataToFirestore(
                currentExerciseData,
                inputText,
                workoutService.areAllSetsValidated(),
                navigation,
                openAnimatedMessage,
                () => workoutTimer.getFormattedTime(),
                workoutTimer.getElapsed(),
                uid,
                workoutService.getWorkoutTemplateName() || 'Workout',
            );
            if (result === false) {
                isFinishingWorkout.current = false;
                return;
            }
            if (!isCurrentWorkoutUser(uid) || workoutService.uid !== uid) {
                isFinishingWorkout.current = false;
                return;
            }
            initializationGeneration.current++;
            workoutTimer.stop();
            await workoutService.clearWorkout();
            setActiveWorkout(null);
            setInputText('');
            await refreshAllData(true);
            isFinishingWorkout.current = false;
        } catch (error) {
            console.error('Error finishing workout:', error instanceof Error ? error.message : String(error));
            Alert.alert('Error', 'An error occurred while finishing the workout.', [{ text: 'OK' }]);
            isFinishingWorkout.current = false;
        }
    }, [
        inputText,
        navigation,
        openAnimatedMessage,
        refreshAllData,
        setActiveWorkout,
        setInputText,
        initializationGeneration,
        isFinishingWorkout,
    ]);

    return { handleExit, handleFinishWorkout };
};
