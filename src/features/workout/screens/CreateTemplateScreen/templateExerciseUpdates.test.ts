import {
  insertDeletedExercise,
  replaceTemplateExercise,
  restoreReplacedExercise,
} from './templateExerciseUpdates';
import type { ExerciseRow } from './templateSelectionPlan';

const row = (
  id: string,
  name: string,
  restTime = 90,
  note = '',
): ExerciseRow => ({
  id,
  exerciseName: name,
  name,
  muscleGroup: 'Chest',
  numSets: '3',
  repRange: '8-12',
  restTime,
  note,
});

describe('template exercise list updates', () => {
  const bench = row('bench', 'Bench Press');
  const fly = row('fly', 'Cable Fly', 120);
  const squat = row('squat', 'Squat');

  test('undoing a deletion reinserts the original exercise at its removed index', () => {
    const exercises = [bench, squat];

    const restored = insertDeletedExercise(exercises, fly, 1);

    expect(restored).toEqual([bench, fly, squat]);
    expect(exercises).toEqual([bench, squat]);
    expect(restored).not.toBe(exercises);
  });

  test('undoing a deletion at the end retains splice append behavior', () => {
    expect(insertDeletedExercise([bench], squat, 20)).toEqual([bench, squat]);
  });

  test('undoing a replacement restores the original row where its replacement currently lives', () => {
    const exercises = [bench, row('replacement', 'Incline Press', 180), squat];

    const restored = restoreReplacedExercise(exercises, fly, 'replacement');

    expect(restored).toEqual([bench, fly, squat]);
    expect(exercises[1]).toMatchObject({ id: 'replacement', name: 'Incline Press' });
    expect(restored).not.toBe(exercises);
  });

  test('undoing a replacement whose row was removed returns the same array unchanged', () => {
    const exercises = [bench, squat];

    expect(restoreReplacedExercise(exercises, fly, 'missing')).toBe(exercises);
  });

  test('replacing an exercise keeps its existing rest time and assigns the new id', () => {
    const replacement = {
      exerciseName: 'Cable Fly',
      name: 'Cable Fly',
      muscleGroup: 'Chest',
      numSets: '4',
      repRange: '10-12',
      restTime: 60,
      note: 'new note',
    };
    const exercises = [bench, squat];

    const updated = replaceTemplateExercise(exercises, 'bench', replacement, 'new-bench');

    expect(updated).toEqual([
      { ...replacement, id: 'new-bench', restTime: 90 },
      squat,
    ]);
    expect(exercises).toEqual([bench, squat]);
  });

  test('replacement falls back to the default rest time when the old value is falsy', () => {
    expect(replaceTemplateExercise(
      [row('old', 'Old Exercise', 0)],
      'old',
      { exerciseName: 'New Exercise', name: 'New Exercise' },
      'new',
    )).toEqual([
      expect.objectContaining({ id: 'new', name: 'New Exercise', restTime: 180 }),
    ]);
  });

  test('replacing an absent id leaves exercises unchanged', () => {
    const exercises = [bench, squat];
    const replacement = { exerciseName: 'Cable Fly', name: 'Cable Fly' };

    expect(replaceTemplateExercise(exercises, 'missing', replacement, 'new')).toEqual(exercises);
  });
});
