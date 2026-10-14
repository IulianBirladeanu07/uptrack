import { customDocToExercise, mergeCustomExercises } from './exerciseCatalog';

const ex = (name, muscleGroup, extra = {}) => ({
  name,
  muscleGroup,
  category: 'General',
  imageURL: '',
  equipment: 'Bodyweight',
  difficulty: 'Intermediate',
  ...extra,
});

const catalog = [
  { muscleGroup: 'Back', exercises: [ex('Deadlift', 'Back'), ex('Row', 'Back')] },
  { muscleGroup: 'Chest', exercises: [ex('Bench Press', 'Chest')] },
];

describe('customDocToExercise', () => {
  test('fills the catalog defaults for missing fields', () => {
    expect(customDocToExercise({ name: 'Cable Fly', muscleGroup: 'Chest' })).toEqual(ex('Cable Fly', 'Chest'));
  });

  test('keeps the fields that are set', () => {
    const doc = { name: 'Cable Fly', muscleGroup: 'Chest', category: 'Isolation', equipment: 'Cable', difficulty: 'Beginner', imageURL: 'https://x/y.png' };
    expect(customDocToExercise(doc)).toEqual(doc);
  });

  test('returns null without a name or muscle group', () => {
    expect(customDocToExercise({ muscleGroup: 'Chest' })).toBeNull();
    expect(customDocToExercise({ name: 'Cable Fly' })).toBeNull();
    expect(customDocToExercise(null)).toBeNull();
    expect(customDocToExercise(undefined)).toBeNull();
  });
});

describe('mergeCustomExercises', () => {
  test('adds a custom exercise to its group in name order', () => {
    const merged = mergeCustomExercises(catalog, [ex('Chest Dip', 'Chest'), ex('Arnold Press', 'Chest')]);
    expect(merged.find(g => g.muscleGroup === 'Chest').exercises.map(e => e.name)).toEqual(['Arnold Press', 'Bench Press', 'Chest Dip']);
  });

  test('creates a group for a muscle group the catalog lacks, keeping groups sorted', () => {
    const merged = mergeCustomExercises(catalog, [ex('Wrist Curl', 'Forearms')]);
    expect(merged.map(g => g.muscleGroup)).toEqual(['Back', 'Chest', 'Forearms']);
  });

  test('skips a custom exercise whose name already exists in the group, ignoring case', () => {
    const merged = mergeCustomExercises(catalog, [ex('bench press', 'Chest')]);
    expect(merged.find(g => g.muscleGroup === 'Chest').exercises).toHaveLength(1);
  });

  test('does not mutate the catalog', () => {
    const before = JSON.stringify(catalog);
    mergeCustomExercises(catalog, [ex('Chest Dip', 'Chest'), ex('Wrist Curl', 'Forearms')]);
    expect(JSON.stringify(catalog)).toBe(before);
  });

  test('returns the catalog unchanged with no custom exercises', () => {
    expect(mergeCustomExercises(catalog, [])).toEqual(catalog);
  });
});
