import { isSameExercise } from '../utils/exerciseIdentity';
import { isValidWorkoutSetInput } from '../utils/workoutSetValidation';
import type { WorkoutExercise, WorkoutSet } from '../types';

export const updateWorkoutWeight = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    setIndex: number,
    value: string,
): WorkoutExercise[] | null => {
    if (!exercises[exerciseIndex]?.sets[setIndex]) return null;
    if (value !== '' && (!/^\d+\.?\d{0,2}$/.test(value) || parseFloat(value) > 500)) return null;

    const currentSet = exercises[exerciseIndex].sets[setIndex];
    const updated = [...exercises];
    updated[exerciseIndex] = { ...updated[exerciseIndex] };
    updated[exerciseIndex].sets = [...updated[exerciseIndex].sets];
    updated[exerciseIndex].sets[setIndex] = {
        ...currentSet,
        weight: value,
        weightModified: true,
        isValidated: currentSet.weight === value ? currentSet.isValidated : false,
    };
    return updated;
};

export const updateWorkoutReps = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    setIndex: number,
    value: string,
): WorkoutExercise[] | null => {
    if (!exercises[exerciseIndex]?.sets[setIndex]) return null;
    if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 100)) return null;

    const currentSet = exercises[exerciseIndex].sets[setIndex];
    const updated = [...exercises];
    updated[exerciseIndex] = { ...updated[exerciseIndex] };
    updated[exerciseIndex].sets = [...updated[exerciseIndex].sets];
    updated[exerciseIndex].sets[setIndex] = {
        ...currentSet,
        reps: value,
        repsModified: true,
        isValidated: currentSet.reps === value ? currentSet.isValidated : false,
    };
    return updated;
};

export const toggleWorkoutSetValidation = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    setIndex: number,
): WorkoutExercise[] | null => {
    const currentSet = exercises[exerciseIndex]?.sets[setIndex];
    if (!currentSet) return null;
    if (!currentSet.isValidated && !isValidWorkoutSetInput(currentSet.weight, currentSet.reps)) return null;

    return exercises.map((exercise, currentExerciseIndex) => currentExerciseIndex !== exerciseIndex
        ? exercise
        : {
            ...exercise,
            sets: exercise.sets.map((set, currentSetIndex) => currentSetIndex !== setIndex
                ? set
                : { ...set, isValidated: !currentSet.isValidated }),
        });
};

export const updateWorkoutExerciseNote = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    note: string,
): WorkoutExercise[] | null => {
    if (!exercises[exerciseIndex]) return null;
    return exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, note } : exercise);
};

export const addWorkoutSet = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    createEmptySet: () => WorkoutSet,
): WorkoutExercise[] | null => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return null;
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = {
        ...createEmptySet(),
        weight: lastSet?.weight ?? '',
        reps: lastSet?.reps ?? '',
    };
    return exercises.map((current, index) => index === exerciseIndex
        ? { ...current, sets: [...current.sets, newSet] }
        : current);
};

export const deleteWorkoutSet = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    setIndex: number,
): WorkoutExercise[] | null => {
    const exercise = exercises[exerciseIndex];
    if (!exercise?.sets[setIndex]) return null;
    if (exercise.sets.length <= 1) return exercises.filter((_, index) => index !== exerciseIndex);
    return exercises.map((current, index) => index === exerciseIndex
        ? { ...current, sets: current.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex) }
        : current);
};

export const deleteWorkoutExercise = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
): WorkoutExercise[] => exercises.filter((_, index) => index !== exerciseIndex);

export const moveWorkoutExercise = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    direction: number,
): WorkoutExercise[] | null => {
    const newIndex = exerciseIndex + direction;
    if (!exercises[exerciseIndex] || newIndex < 0 || newIndex >= exercises.length) return null;
    const updated = [...exercises];
    const [moved] = updated.splice(exerciseIndex, 1);
    updated.splice(newIndex, 0, moved);
    return updated;
};

export const replaceWorkoutExercise = (
    exercises: WorkoutExercise[],
    exerciseIndex: number,
    newExercise: WorkoutExercise,
): WorkoutExercise[] | null => {
    if (!exercises[exerciseIndex]) return null;
    return exercises.map((exercise, index) => index === exerciseIndex ? newExercise : exercise);
};

export const addWorkoutExercises = (
    currentExercises: WorkoutExercise[],
    newExercises: WorkoutExercise[] | null | undefined,
): WorkoutExercise[] | null => {
    if (!newExercises || !Array.isArray(newExercises)) return null;
    const filtered: WorkoutExercise[] = [];
    for (const exercise of newExercises) {
        if (
            !exercise?.exerciseName ||
            [...currentExercises, ...filtered].some(existing => isSameExercise(existing, exercise))
        ) continue;
        filtered.push(exercise);
    }
    return filtered.length ? [...currentExercises, ...filtered] : null;
};

export const areAllWorkoutSetsValidated = (exercises: WorkoutExercise[]): boolean =>
    exercises.length > 0 && exercises.every(exercise => exercise.sets.every(set => set.isValidated));
