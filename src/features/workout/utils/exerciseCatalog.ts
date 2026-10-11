import type { CatalogExercise, ExerciseGroup } from '../../../shared/types';

const byName = (a: CatalogExercise, b: CatalogExercise): number => a.name.localeCompare(b.name);

export const customDocToExercise = (data: Partial<CatalogExercise> | null | undefined): CatalogExercise | null => {
  if (!data?.name || !data.muscleGroup) return null;
  return {
    name: data.name,
    muscleGroup: data.muscleGroup,
    category: data.category || 'General',
    imageURL: data.imageURL || '',
    equipment: data.equipment || 'Bodyweight',
    difficulty: data.difficulty || 'Intermediate',
  };
};

export const mergeCustomExercises = (catalog: ExerciseGroup[], custom: CatalogExercise[]): ExerciseGroup[] => {
  const groups = new Map<string, CatalogExercise[]>(catalog.map(g => [g.muscleGroup, [...g.exercises]]));
  custom.forEach(ex => {
    const list = groups.get(ex.muscleGroup) || [];
    if (list.some(e => e.name.toLowerCase() === ex.name.toLowerCase())) return;
    groups.set(ex.muscleGroup, [...list, ex].sort(byName));
  });
  return [...groups.entries()]
    .map(([muscleGroup, exercises]) => ({ muscleGroup, exercises }))
    .sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
};
