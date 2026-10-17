import { planTemplateSelection, type ExerciseRow } from './templateSelectionPlan';

const row = (id: string, name: string, muscleGroup = 'Chest'): ExerciseRow => ({
  id,
  exerciseName: name,
  name,
  muscleGroup,
  numSets: '3',
  repRange: '8-12',
  restTime: 90,
});

const picked = (name: string, muscleGroup = 'Chest') => ({
  exerciseName: name,
  name,
  muscleGroup,
  numSets: '',
  repRange: '',
});

const existing = [row('a', 'Bench Press'), row('b', 'Incline Press'), row('c', 'Squat', 'Quads')];

describe('planTemplateSelection replacing', () => {
  it('replaces the exercise with the matching id', () => {
    const replacement = picked('Cable Fly');
    expect(planTemplateSelection(replacement, 'b', existing)).toEqual({
      type: 'replace',
      index: 1,
      original: existing[1],
      replacement,
    });
  });

  it('uses the first entry when the selection is a list', () => {
    const plan = planTemplateSelection([picked('Cable Fly'), picked('Dips')], 'a', existing);
    expect(plan).toMatchObject({ type: 'replace', index: 0, replacement: { name: 'Cable Fly' } });
  });

  it('allows replacing a row with the same exercise it already is', () => {
    expect(planTemplateSelection(picked('Bench Press'), 'a', existing)).toMatchObject({ type: 'replace', index: 0 });
  });

  it('refuses a replacement that is already another row', () => {
    expect(planTemplateSelection(picked('Incline Press'), 'a', existing)).toEqual({ type: 'replace-duplicate' });
  });

  it('does not treat the same name in another muscle group as a duplicate', () => {
    expect(planTemplateSelection(picked('Incline Press', 'Shoulders'), 'a', existing)).toMatchObject({ type: 'replace' });
  });

  it('fails when the row to replace no longer exists', () => {
    expect(planTemplateSelection(picked('Cable Fly'), 'gone', existing)).toEqual({ type: 'replace-failed' });
  });

  it('fails when the replacement has no usable name', () => {
    expect(planTemplateSelection(null, 'a', existing)).toEqual({ type: 'replace-failed' });
    expect(planTemplateSelection([], 'a', existing)).toEqual({ type: 'replace-failed' });
    expect(planTemplateSelection({ exerciseName: '', name: '' }, 'a', existing)).toEqual({ type: 'replace-failed' });
  });

  it('fails when the template has no rows at all', () => {
    expect(planTemplateSelection([picked('Cable Fly')], 'zzz', [])).toEqual({ type: 'replace-failed' });
  });
});

describe('planTemplateSelection adding a list', () => {
  it('adds every new exercise with the default rest time', () => {
    const plan = planTemplateSelection([picked('Cable Fly'), picked('Dips')], null, existing);
    expect(plan).toEqual({
      type: 'add',
      exercises: [
        { ...picked('Cable Fly'), restTime: 180 },
        { ...picked('Dips'), restTime: 180 },
      ],
      hasDuplicate: false,
    });
  });

  it('skips exercises already in the template and reports the duplicate', () => {
    const plan = planTemplateSelection([picked('Bench Press'), picked('Dips')], null, existing);
    expect(plan).toEqual({
      type: 'add',
      exercises: [{ ...picked('Dips'), restTime: 180 }],
      hasDuplicate: true,
    });
  });

  it('skips repeats inside the same selection', () => {
    const plan = planTemplateSelection([picked('Dips'), picked('Dips')], null, existing);
    expect(plan).toMatchObject({ type: 'add', hasDuplicate: true });
    expect(plan.type === 'add' && plan.exercises).toHaveLength(1);
  });

  it('keeps the same name in a different muscle group', () => {
    const plan = planTemplateSelection([picked('Bench Press', 'Shoulders')], null, existing);
    expect(plan).toMatchObject({ type: 'add', hasDuplicate: false });
    expect(plan.type === 'add' && plan.exercises).toHaveLength(1);
  });

  it('ignores entries without a name', () => {
    const plan = planTemplateSelection([{ exerciseName: '', name: '' }, picked('Dips')], null, existing);
    expect(plan).toMatchObject({ type: 'add', hasDuplicate: false });
    expect(plan.type === 'add' && plan.exercises.map(e => e.name)).toEqual(['Dips']);
  });

  it('returns an empty add for an empty list', () => {
    expect(planTemplateSelection([], null, existing)).toEqual({ type: 'add', exercises: [], hasDuplicate: false });
  });

  it('treats an empty replace id as a plain add', () => {
    expect(planTemplateSelection([picked('Dips')], '', existing)).toMatchObject({ type: 'add' });
  });

  it('does not change the selection it is given', () => {
    const selection = [picked('Dips')];
    planTemplateSelection(selection, null, existing);
    expect(selection[0]).not.toHaveProperty('restTime');
  });
});

describe('planTemplateSelection adding one exercise', () => {
  it('hands a single named exercise back with the default rest time', () => {
    expect(planTemplateSelection(picked('Dips'), null, existing)).toEqual({
      type: 'add-single',
      exercise: { ...picked('Dips'), restTime: 180 },
    });
  });

  it('leaves duplicate checking of a single exercise to the caller', () => {
    expect(planTemplateSelection(picked('Bench Press'), null, existing)).toMatchObject({ type: 'add-single' });
  });

  it('does nothing for a missing or unnamed selection', () => {
    expect(planTemplateSelection(null, null, existing)).toEqual({ type: 'none' });
    expect(planTemplateSelection(null, undefined, existing)).toEqual({ type: 'none' });
    expect(planTemplateSelection({ exerciseName: '', name: '' }, null, existing)).toEqual({ type: 'none' });
  });
});
