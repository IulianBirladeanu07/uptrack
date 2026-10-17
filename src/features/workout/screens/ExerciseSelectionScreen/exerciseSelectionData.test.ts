import type { ExerciseGroup } from '../../../../shared/types';
import {
    buildExerciseCatalogData,
    filterAndGroupExercises,
    flattenExerciseSections,
} from './exerciseSelectionData';

const catalog: ExerciseGroup[] = [
    {
        muscleGroup: 'Chest',
        exercises: [
            {
                name: 'Bench Press',
                muscleGroup: 'Incorrect Group',
                category: 'Compound',
                imageURL: '',
                equipment: 'Barbell',
                difficulty: 'Intermediate',
            },
            {
                name: 'Cable Fly',
                muscleGroup: 'Chest',
                category: 'Isolation',
                imageURL: '',
                equipment: 'Cable',
                difficulty: 'Beginner',
            },
        ],
    },
    {
        muscleGroup: 'Back',
        exercises: [{
            name: 'Barbell Row',
            muscleGroup: 'Back',
            category: 'Compound',
            imageURL: '',
            equipment: 'Barbell',
            difficulty: 'Intermediate',
        }],
    },
];

describe('buildExerciseCatalogData', () => {
    it('builds identity-keyed exercises, sorted groups, and group counts', () => {
        const result = buildExerciseCatalogData(catalog);

        expect(result.muscleGroups).toEqual(['Back', 'Chest']);
        expect(result.counts).toEqual({ total: 3, Chest: 2, Back: 1 });
        expect(result.flatExercises).toHaveLength(3);
        expect(result.flatExercises[0]).toMatchObject({
            name: 'Bench Press',
            muscleGroup: 'Chest',
            id: JSON.stringify(['Chest', 'Bench Press']),
        });
        expect(result.exerciseMap.get(JSON.stringify(['Chest', 'Bench Press']))).toEqual(result.flatExercises[0]);
    });

    it('handles empty input and ignores malformed groups or nameless exercises', () => {
        expect(buildExerciseCatalogData([])).toMatchObject({
            muscleGroups: [],
            counts: { total: 0 },
            flatExercises: [],
        });
        expect(buildExerciseCatalogData([
            null,
            { muscleGroup: 'Legs', exercises: null },
            {
                muscleGroup: 'Legs',
                exercises: [{
                    name: '',
                    muscleGroup: 'Legs',
                    category: 'Compound',
                    imageURL: '',
                    equipment: 'Barbell',
                    difficulty: 'Beginner',
                }],
            },
        ] as unknown as ExerciseGroup[])).toMatchObject({
            muscleGroups: ['Legs'],
            counts: { total: 1, Legs: 1 },
            flatExercises: [],
        });
    });

    it('retains the existing count behavior for repeated muscle-group entries', () => {
        const result = buildExerciseCatalogData([
            catalog[0],
            { muscleGroup: 'Chest', exercises: [catalog[0].exercises[0]] },
        ]);

        expect(result.counts).toEqual({ total: 3, Chest: 1 });
    });
});

describe('filterAndGroupExercises', () => {
    const exercises = buildExerciseCatalogData(catalog).flatExercises;

    it('filters by muscle group and groups matching results in catalog order', () => {
        expect(filterAndGroupExercises(exercises, '', 'Chest')).toEqual([{
            title: 'Chest',
            data: exercises.slice(0, 2),
        }]);
    });

    it('searches case-insensitively across name, equipment, category, and muscle group', () => {
        expect(filterAndGroupExercises(exercises, '  BARBELL ', 'All')
            .flatMap(section => section.data.map(exercise => exercise.name)))
            .toEqual(['Bench Press', 'Barbell Row']);
        expect(filterAndGroupExercises(exercises, 'isolation', 'All')
            .flatMap(section => section.data.map(exercise => exercise.name)))
            .toEqual(['Cable Fly']);
        expect(filterAndGroupExercises(exercises, 'back', 'All')
            .flatMap(section => section.data.map(exercise => exercise.name)))
            .toEqual(['Barbell Row']);
    });

    it('returns no sections when no exercise matches', () => {
        expect(filterAndGroupExercises(exercises, 'unknown', 'All')).toEqual([]);
    });
});

describe('flattenExerciseSections', () => {
    it('creates stable section headers and unique row ids', () => {
        const sections = filterAndGroupExercises(
            buildExerciseCatalogData(catalog).flatExercises,
            '',
            'All',
        );

        expect(flattenExerciseSections(sections)).toEqual([
            { type: 'header', title: 'Chest', id: 'header-Chest-0' },
            expect.objectContaining({
                type: 'item',
                name: 'Bench Press',
                listId: `${JSON.stringify(['Chest', 'Bench Press'])}-0-0`,
            }),
            expect.objectContaining({
                type: 'item',
                name: 'Cable Fly',
                listId: `${JSON.stringify(['Chest', 'Cable Fly'])}-0-1`,
            }),
            { type: 'header', title: 'Back', id: 'header-Back-1' },
            expect.objectContaining({
                type: 'item',
                name: 'Barbell Row',
                listId: `${JSON.stringify(['Back', 'Barbell Row'])}-1-0`,
            }),
        ]);
    });
});
