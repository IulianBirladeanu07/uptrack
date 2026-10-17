import {
  EXERCISE_DATA,
  buildCustomExercisePayload,
  createEmptyExerciseForm,
  filterPickerOptions,
  getFormProgress,
  validateExerciseForm,
  type ExerciseFormData,
} from './createExerciseForm';

const validForm: ExerciseFormData = {
  name: 'Barbell Squat',
  muscleGroup: 'Quads',
  equipment: 'Barbell',
  category: 'Compound',
};

describe('exercise picker data', () => {
  it('keeps the option counts and unique names per picker', () => {
    expect(EXERCISE_DATA.muscleGroups).toHaveLength(12);
    expect(EXERCISE_DATA.equipment).toHaveLength(9);
    expect(EXERCISE_DATA.categories).toHaveLength(4);
    Object.values(EXERCISE_DATA).forEach(options => {
      const names = options.map(option => option.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  it('gives every option an icon, description and hex color', () => {
    Object.values(EXERCISE_DATA).forEach(options => {
      options.forEach(option => {
        expect(option.icon).toBeTruthy();
        expect(option.desc).toBeTruthy();
        expect(option.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});

describe('createEmptyExerciseForm', () => {
  it('returns blank fields and a new object each time', () => {
    const first = createEmptyExerciseForm();
    expect(first).toEqual({ name: '', muscleGroup: '', equipment: '', category: '' });
    first.name = 'changed';
    expect(createEmptyExerciseForm().name).toBe('');
  });
});

describe('getFormProgress', () => {
  it('counts each filled field as a quarter', () => {
    expect(getFormProgress(createEmptyExerciseForm())).toBe(0);
    expect(getFormProgress({ ...createEmptyExerciseForm(), name: 'Curl' })).toBe(0.25);
    expect(getFormProgress({ ...createEmptyExerciseForm(), muscleGroup: 'Back', category: 'Isolation' })).toBe(0.5);
    expect(getFormProgress({ ...validForm, category: '' })).toBe(0.75);
    expect(getFormProgress(validForm)).toBe(1);
  });

  it('ignores a name made only of spaces', () => {
    expect(getFormProgress({ ...createEmptyExerciseForm(), name: '   ' })).toBe(0);
  });
});

describe('validateExerciseForm', () => {
  it('accepts a complete form', () => {
    expect(validateExerciseForm(validForm)).toEqual({});
  });

  it('reports every missing field with its message', () => {
    expect(validateExerciseForm(createEmptyExerciseForm())).toEqual({
      name: 'Exercise name is required',
      muscleGroup: 'Please select a muscle group',
      equipment: 'Please select equipment type',
      category: 'Please select exercise type',
    });
  });

  it('treats a whitespace-only name as missing', () => {
    expect(validateExerciseForm({ ...validForm, name: '    ' }).name).toBe('Exercise name is required');
  });

  it('enforces the name length limits after trimming', () => {
    expect(validateExerciseForm({ ...validForm, name: 'a' }).name).toBe('Name must be at least 2 characters');
    expect(validateExerciseForm({ ...validForm, name: ' a ' }).name).toBe('Name must be at least 2 characters');
    expect(validateExerciseForm({ ...validForm, name: 'ab' }).name).toBeUndefined();
    expect(validateExerciseForm({ ...validForm, name: 'a'.repeat(50) }).name).toBeUndefined();
    expect(validateExerciseForm({ ...validForm, name: 'a'.repeat(51) }).name).toBe('Name must be less than 50 characters');
    expect(validateExerciseForm({ ...validForm, name: ` ${'a'.repeat(50)} ` }).name).toBeUndefined();
  });

  it('flags only the fields that are wrong', () => {
    expect(validateExerciseForm({ ...validForm, equipment: '' })).toEqual({
      equipment: 'Please select equipment type',
    });
  });
});

describe('buildCustomExercisePayload', () => {
  it('trims the name and adds the fixed fields', () => {
    expect(buildCustomExercisePayload({ ...validForm, name: '  Barbell Squat  ' })).toEqual({
      name: 'Barbell Squat',
      muscleGroup: 'Quads',
      equipment: 'Barbell',
      category: 'Compound',
      imageURL: '',
      difficulty: 'Intermediate',
    });
  });

  it('does not change the form it is given', () => {
    const form = { ...validForm, name: '  Row  ' };
    buildCustomExercisePayload(form);
    expect(form.name).toBe('  Row  ');
  });
});

describe('filterPickerOptions', () => {
  const options = EXERCISE_DATA.muscleGroups;

  it('returns the same list when the query is empty', () => {
    expect(filterPickerOptions(options, '')).toBe(options);
  });

  it('matches names without regard to case', () => {
    expect(filterPickerOptions(options, 'CHEST').map(option => option.name)).toEqual(['Chest']);
  });

  it('matches descriptions as well as names', () => {
    expect(filterPickerOptions(options, 'bicep').map(option => option.name)).toEqual(['Biceps', 'Hamstring']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterPickerOptions(options, 'zzz')).toEqual([]);
  });

  it('works for the other pickers', () => {
    expect(filterPickerOptions(EXERCISE_DATA.categories, 'joint').map(option => option.name)).toEqual(['Compound', 'Isolation']);
    expect(filterPickerOptions(EXERCISE_DATA.equipment, 'band').map(option => option.name)).toEqual(['Resistance Band']);
  });
});
