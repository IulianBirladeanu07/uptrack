import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';

import type { PersistedWorkoutState, WorkoutExercise } from '../../types';
import { workoutService } from '../../services/WorkoutService';
import { workoutTimer } from '../../services/WorkoutTimerService';
import { toSelectedWorkout } from './selectedWorkoutData';
import type { SelectedWorkout } from './selectedWorkoutData';

type WorkoutSessionInitializationOptions = {
    selectedWorkout: unknown;
    setExerciseData: (exercises: WorkoutExercise[]) => void;
    setInputText: (note: string) => void;
    setSelectedExercise: (exerciseName: string | null) => void;
    setIsValidationPressed: (pressed: boolean) => void;
    setActiveWorkout: (workout: PersistedWorkoutState | null) => void;
    refreshAllData: () => unknown;
};

const isCurrentUser = (uid: string | undefined): uid is string =>
    !!uid && getAuth().currentUser?.uid === uid;

export const useWorkoutSessionInitialization = ({
    selectedWorkout: selectedWorkoutInput,
    setExerciseData,
    setInputText,
    setSelectedExercise,
    setIsValidationPressed,
    setActiveWorkout,
    refreshAllData,
}: WorkoutSessionInitializationOptions) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const isFinishingWorkout = useRef(false);
    const isInitialized = useRef(false);
    const initializationGeneration = useRef(0);
    const selectedWorkoutRef = useRef(selectedWorkoutInput);

    const syncActiveWorkout = useCallback(() => {
        const startTime = workoutService.getStartTime();
        if (!startTime) return;
        setActiveWorkout({
            startTime,
            exercises: workoutService.getExerciseData(),
            note: workoutService.getWorkoutNote(),
            templateName: workoutService.getWorkoutTemplateName(),
            isActive: true,
            lastSaved: Date.now(),
        });
    }, [setActiveWorkout]);

    const handleSelectedWorkout = useCallback(async (
        selectedWorkout: SelectedWorkout,
        requestGeneration: number,
    ) => {
        const { note, exercises, templateName } = selectedWorkout;
        if (!exercises || !Array.isArray(exercises)) return;
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentUser(uid)) return;
        workoutService.startWorkout();
        workoutService.setWorkoutTemplateName(templateName || '');
        setInputText(note || '');
        workoutService.setWorkoutNote(note || '');
        syncActiveWorkout();
        const loadedData = await workoutService.loadWorkoutFromTemplate(exercises);
        if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
        setExerciseData(loadedData);
        workoutTimer.start();
        setSelectedExercise(loadedData[0]?.exerciseName || null);
        setIsValidationPressed(false);
    }, [
        setExerciseData,
        setInputText,
        setIsValidationPressed,
        setSelectedExercise,
        syncActiveWorkout,
    ]);

    useEffect(() => {
        const selectedWorkout = toSelectedWorkout(selectedWorkoutRef.current);
        const requestGeneration = ++initializationGeneration.current;
        const unsubscribe = workoutService.subscribe(newData => {
            if (!isFinishingWorkout.current) {
                setExerciseData(newData);
                setIsValidationPressed(workoutService.areAllSetsValidated());
            }
        });

        const initWorkout = async () => {
            const uid = getAuth().currentUser?.uid;
            if (!isCurrentUser(uid)) return;
            if (selectedWorkout) {
                await handleSelectedWorkout(selectedWorkout, requestGeneration);
                if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
                setIsInitializing(false);
            } else {
                const restored = await workoutService.restoreWorkout();
                if (!isCurrentUser(uid) || requestGeneration !== initializationGeneration.current) return;
                if (restored) {
                    workoutTimer.restore(restored.startTime);
                    setExerciseData(workoutService.getExerciseData());
                    setInputText(workoutService.getWorkoutNote());
                } else {
                    workoutService.startWorkout();
                    workoutTimer.start();
                    setInputText('');
                    setExerciseData(workoutService.getExerciseData());
                }
                setIsInitializing(false);
            }
            syncActiveWorkout();
            refreshAllData();
        };

        initWorkout();
        isInitialized.current = true;
        return () => {
            unsubscribe();
            if (requestGeneration === initializationGeneration.current) {
                initializationGeneration.current++;
            }
        };
    }, [
        handleSelectedWorkout,
        refreshAllData,
        setExerciseData,
        setInputText,
        setIsValidationPressed,
        syncActiveWorkout,
    ]);

    return {
        isInitializing,
        isFinishingWorkout,
        isInitialized,
        initializationGeneration,
    };
};
