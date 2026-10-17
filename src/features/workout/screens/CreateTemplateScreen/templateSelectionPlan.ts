import type { TemplateExercise } from '../../types';
import { isSameExercise } from '../../utils/exerciseIdentity';

export type ExerciseRow = TemplateExercise & { id: string };

type Selection = TemplateExercise[] | TemplateExercise | null;

export type TemplateSelectionPlan =
  | { type: 'none' }
  | { type: 'replace-failed' }
  | { type: 'replace-duplicate' }
  | { type: 'replace'; index: number; original: ExerciseRow; replacement: TemplateExercise }
  | { type: 'add'; exercises: TemplateExercise[]; hasDuplicate: boolean }
  | { type: 'add-single'; exercise: TemplateExercise };

const DEFAULT_REST_TIME = 180;

const isNamed = (exercise: TemplateExercise | null | undefined): exercise is TemplateExercise =>
  !!exercise && typeof exercise === 'object' && !!(exercise.exerciseName || exercise.name);

export const planTemplateSelection = (
  selection: Selection,
  replaceId: string | null | undefined,
  exercises: ExerciseRow[]
): TemplateSelectionPlan => {
  if (replaceId) {
    const replacement = Array.isArray(selection) ? selection[0] : selection;
    if (!isNamed(replacement)) return { type: 'replace-failed' };

    const index = exercises.findIndex((ex) => ex.id === replaceId);
    if (index === -1) return { type: 'replace-failed' };

    const isDuplicate = exercises.some(
      (existing) => existing.id !== replaceId && isSameExercise(existing, replacement)
    );
    if (isDuplicate) return { type: 'replace-duplicate' };

    return { type: 'replace', index, original: exercises[index] as ExerciseRow, replacement };
  }

  if (Array.isArray(selection)) {
    const toAdd: TemplateExercise[] = [];
    let hasDuplicate = false;
    selection.forEach((exercise) => {
      if (isNamed(exercise)) {
        const normalized = { ...exercise, restTime: DEFAULT_REST_TIME };
        if (
          exercises.some((existing) => isSameExercise(existing, normalized)) ||
          toAdd.some((existing) => isSameExercise(existing, normalized))
        ) {
          hasDuplicate = true;
        } else {
          toAdd.push(normalized);
        }
      }
    });
    return { type: 'add', exercises: toAdd, hasDuplicate };
  }

  if (isNamed(selection)) {
    return { type: 'add-single', exercise: { ...selection, restTime: DEFAULT_REST_TIME } };
  }

  return { type: 'none' };
};
