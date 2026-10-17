import type { TemplateExercise } from '../../types';
import type { ExerciseRow } from './templateSelectionPlan';

export const insertDeletedExercise = (
  exercises: ExerciseRow[],
  exercise: ExerciseRow,
  index: number,
): ExerciseRow[] => {
  const restored = [...exercises];
  restored.splice(index, 0, exercise);
  return restored;
};

export const restoreReplacedExercise = (
  exercises: ExerciseRow[],
  original: ExerciseRow,
  replacedWithId: string,
): ExerciseRow[] => {
  const index = exercises.findIndex(exercise => exercise.id === replacedWithId);
  if (index === -1) return exercises;

  const restored = [...exercises];
  restored[index] = original;
  return restored;
};

export const replaceTemplateExercise = (
  exercises: ExerciseRow[],
  replacedId: string,
  replacement: TemplateExercise,
  replacementId: string,
): ExerciseRow[] => exercises.map(exercise => exercise.id === replacedId
  ? { ...replacement, id: replacementId, restTime: exercise.restTime || 180 }
  : exercise
);
