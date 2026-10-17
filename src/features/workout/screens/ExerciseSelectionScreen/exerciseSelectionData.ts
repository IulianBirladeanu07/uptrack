import type { CatalogExercise, ExerciseGroup } from '../../../../shared/types';
import { exerciseIdentityKey } from '../../utils/exerciseIdentity';

export type ExerciseItemData = CatalogExercise & { id: string };
export type ExerciseCounts = { total: number; [muscleGroup: string]: number };
export type ExerciseSection = { title: string; data: ExerciseItemData[] };
export type ExerciseListRow =
    | { type: 'header'; title: string; id: string }
    | (ExerciseItemData & { type: 'item'; listId: string });

export type ExerciseCatalogData = {
    exerciseMap: Map<string, ExerciseItemData>;
    muscleGroups: string[];
    counts: ExerciseCounts;
    flatExercises: ExerciseItemData[];
};

export const buildExerciseCatalogData = (
    allGroupedExercises: ExerciseGroup[],
): ExerciseCatalogData => {
    const exerciseMap = new Map<string, ExerciseItemData>();
    const muscleGroups = new Set<string>();
    const counts: ExerciseCounts = { total: 0 };
    const flatExercises: ExerciseItemData[] = [];

    if (!Array.isArray(allGroupedExercises)) {
        return { exerciseMap, muscleGroups: [], counts, flatExercises };
    }

    allGroupedExercises.forEach(group => {
        if (!group?.muscleGroup || !Array.isArray(group.exercises)) return;

        muscleGroups.add(group.muscleGroup);
        counts[group.muscleGroup] = group.exercises.length;
        counts.total += group.exercises.length;

        group.exercises.forEach(exercise => {
            if (!exercise?.name) return;
            const enrichedExercise: ExerciseItemData = {
                ...exercise,
                muscleGroup: group.muscleGroup,
                id: exerciseIdentityKey(exercise.name, group.muscleGroup),
            };
            exerciseMap.set(enrichedExercise.id, enrichedExercise);
            flatExercises.push(enrichedExercise);
        });
    });

    return {
        exerciseMap,
        muscleGroups: [...muscleGroups].sort(),
        counts,
        flatExercises,
    };
};

export const filterAndGroupExercises = (
    exercises: ExerciseItemData[],
    searchTerm: string,
    activeFilter: string,
): ExerciseSection[] => {
    if (!exercises.length) return [];

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = exercises.filter(exercise =>
        (activeFilter === 'All' || exercise.muscleGroup === activeFilter) &&
        (!searchLower ||
            exercise.name?.toLowerCase().includes(searchLower) ||
            exercise.equipment?.toLowerCase().includes(searchLower) ||
            exercise.category?.toLowerCase().includes(searchLower) ||
            exercise.muscleGroup?.toLowerCase().includes(searchLower))
    );

    const sections = new Map<string, ExerciseSection>();
    filtered.forEach(exercise => {
        let section = sections.get(exercise.muscleGroup);
        if (!section) {
            section = { title: exercise.muscleGroup, data: [] };
            sections.set(exercise.muscleGroup, section);
        }
        section.data.push(exercise);
    });

    return [...sections.values()];
};

export const flattenExerciseSections = (sections: ExerciseSection[]): ExerciseListRow[] => {
    const rows: ExerciseListRow[] = [];
    sections.forEach((section, sectionIndex) => {
        rows.push({
            type: 'header',
            title: section.title,
            id: `header-${section.title}-${sectionIndex}`,
        });
        section.data.forEach((exercise, itemIndex) => {
            rows.push({
                type: 'item',
                ...exercise,
                listId: `${exercise.id}-${sectionIndex}-${itemIndex}`,
            });
        });
    });
    return rows;
};
