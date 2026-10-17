import { useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';

import { createEmptySet, workoutService } from '../../services/WorkoutService';
import { isSameExercise } from '../../utils/exerciseIdentity';
import type { WorkoutExercise } from '../../types';
import { toSelectedExercises } from './selectedWorkoutData';
import { isCurrentWorkoutUser } from './workoutUserGuard';

type WorkoutExerciseSelectionOptions = {
    initializationGeneration: { current: number };
    selectedExercise: string | null;
    setSelectedExercise: (exerciseName: string | null) => void;
    setExerciseData: (exercises: WorkoutExercise[]) => void;
    openAnimatedMessage: (message: string) => void;
};

export const useWorkoutExerciseSelection = ({
    initializationGeneration,
    selectedExercise,
    setSelectedExercise,
    setExerciseData,
    openAnimatedMessage,
}: WorkoutExerciseSelectionOptions) => {
    const pendingReplaceRef = useRef<number | null>(null);

    const markExerciseForReplacement = useCallback((exerciseIndex: number) => {
        pendingReplaceRef.current = exerciseIndex;
    }, []);

    const addNewExercisesFromRoute = useCallback(async (exercises: unknown) => {
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentWorkoutUser(uid)) return;
        const requestGeneration = initializationGeneration.current;
        const selectedExercises = toSelectedExercises(exercises);
        if (selectedExercises.length === 0) return;
        const currentData = workoutService.getExerciseData();
        const newExercises: WorkoutExercise[] = [];

        for (const exercise of selectedExercises) {
            if ([...currentData, ...newExercises].some(existing => isSameExercise(existing, exercise))) continue;
            const lastSets = await workoutService.fetchLastSets(exercise.exerciseName, exercise.muscleGroup);
            if (!isCurrentWorkoutUser(uid) || requestGeneration !== initializationGeneration.current) return;
            newExercises.push({
                exerciseName: exercise.exerciseName,
                muscleGroup: exercise.muscleGroup || '',
                category: exercise.category || '',
                imageURL: exercise.imageURL || '',
                sets: [createEmptySet()],
                lastWorkoutSets: lastSets,
                repRange: exercise.repRange || '',
            });
        }

        if (newExercises.length > 0) {
            workoutService.addExercises(newExercises);
            const updatedData = workoutService.getExerciseData();
            setExerciseData(updatedData);
            if (!selectedExercise) {
                setSelectedExercise(newExercises[0]?.exerciseName || null);
            }
        }
    }, [initializationGeneration, selectedExercise, setExerciseData, setSelectedExercise]);

    const replaceExerciseFromRoute = useCallback(async (targetIndex: number, selected: unknown) => {
        const uid = getAuth().currentUser?.uid;
        if (!isCurrentWorkoutUser(uid)) return;
        const requestGeneration = initializationGeneration.current;
        const incoming = toSelectedExercises(Array.isArray(selected) ? selected : [selected])[0];
        if (!incoming) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }

        const currentData = workoutService.getExerciseData();
        const replaced = currentData[targetIndex];
        if (!replaced) {
            openAnimatedMessage('Failed to replace exercise. Please try again.');
            return;
        }

        const isDuplicate = currentData.some((exercise, index) =>
            index !== targetIndex && isSameExercise(exercise, incoming)
        );
        if (isDuplicate) {
            openAnimatedMessage('This exercise is already added.');
            return;
        }

        const lastSets = await workoutService.fetchLastSets(incoming.exerciseName, incoming.muscleGroup);
        if (!isCurrentWorkoutUser(uid) || requestGeneration !== initializationGeneration.current) return;
        const newExercise: WorkoutExercise = {
            exerciseName: incoming.exerciseName,
            muscleGroup: incoming.muscleGroup || '',
            category: incoming.category || '',
            imageURL: incoming.imageURL || '',
            sets: replaced.sets.map(() => createEmptySet()),
            lastWorkoutSets: lastSets,
            repRange: incoming.repRange || replaced.repRange || '',
        };

        workoutService.replaceExercise(targetIndex, newExercise);
        setExerciseData(workoutService.getExerciseData());
        if (selectedExercise === replaced.exerciseName) {
            setSelectedExercise(incoming.exerciseName);
        }
    }, [
        initializationGeneration,
        openAnimatedMessage,
        selectedExercise,
        setExerciseData,
        setSelectedExercise,
    ]);

    const takePendingReplacement = useCallback(() => {
        const targetIndex = pendingReplaceRef.current;
        pendingReplaceRef.current = null;
        return targetIndex;
    }, []);

    return {
        markExerciseForReplacement,
        takePendingReplacement,
        addNewExercisesFromRoute,
        replaceExerciseFromRoute,
    };
};
