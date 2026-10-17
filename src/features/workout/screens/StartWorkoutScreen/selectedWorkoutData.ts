import type { WorkoutExercise, WorkoutSet } from '../../types';

type SelectedExercise = {
    exerciseName: string;
    name?: string;
    muscleGroup?: string;
    category?: string;
    imageURL?: string;
    repRange?: string;
};

export type SelectedWorkout = {
    note?: string;
    exercises: WorkoutExercise[];
    templateName?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getExerciseName = (value: Record<string, unknown>): string =>
    typeof value['exerciseName'] === 'string' ? value['exerciseName'] :
    typeof value['name'] === 'string' ? value['name'] :
    '';

export const toWorkoutExercise = (value: unknown): WorkoutExercise | null => {
    if (!isRecord(value)) return null;
    const exerciseName = getExerciseName(value);
    if (!exerciseName) return null;

    const inputSets = value['sets'];
    const sets: WorkoutSet[] = Array.isArray(inputSets)
        ? inputSets.filter(isRecord).map((set, index) => ({
            id: typeof set['id'] === 'string' ? set['id'] : `template-set-${index}`,
            weight: typeof set['weight'] === 'number' || typeof set['weight'] === 'string' ? String(set['weight']) : '',
            reps: typeof set['reps'] === 'number' || typeof set['reps'] === 'string' ? String(set['reps']) : '',
            isValidated: false,
            repsModified: false,
        }))
        : [];

    const exercise: WorkoutExercise = { exerciseName, sets };
    if (typeof value['name'] === 'string') exercise.name = value['name'];
    if (typeof value['muscleGroup'] === 'string') exercise.muscleGroup = value['muscleGroup'];
    if (typeof value['category'] === 'string') exercise.category = value['category'];
    if (typeof value['imageURL'] === 'string') exercise.imageURL = value['imageURL'];
    if (typeof value['numSets'] === 'number' || typeof value['numSets'] === 'string') exercise.numSets = value['numSets'];
    if (typeof value['repRange'] === 'string') exercise.repRange = value['repRange'];
    if (typeof value['note'] === 'string') exercise.note = value['note'];
    return exercise;
};

export const toSelectedWorkout = (value: unknown): SelectedWorkout | null => {
    if (!isRecord(value) || !Array.isArray(value['exercises'])) return null;
    const workout: SelectedWorkout = {
        exercises: value['exercises'].map(toWorkoutExercise)
            .filter((exercise): exercise is WorkoutExercise => exercise !== null),
    };
    if (typeof value['note'] === 'string') workout.note = value['note'];
    if (typeof value['templateName'] === 'string') workout.templateName = value['templateName'];
    return workout;
};

export const toSelectedExercises = (value: unknown): SelectedExercise[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap(exercise => {
        if (!isRecord(exercise)) return [];
        const exerciseName = getExerciseName(exercise);
        if (!exerciseName) return [];
        const selected: SelectedExercise = { exerciseName };
        if (typeof exercise['name'] === 'string') selected.name = exercise['name'];
        if (typeof exercise['muscleGroup'] === 'string') selected.muscleGroup = exercise['muscleGroup'];
        if (typeof exercise['category'] === 'string') selected.category = exercise['category'];
        if (typeof exercise['imageURL'] === 'string') selected.imageURL = exercise['imageURL'];
        if (typeof exercise['repRange'] === 'string') selected.repRange = exercise['repRange'];
        return [selected];
    });
};
