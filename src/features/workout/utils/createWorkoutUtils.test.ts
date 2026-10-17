import { Alert, Platform, ToastAndroid } from 'react-native';
import {
  createExerciseFromSelection,
  createTemplateData,
  validateBasicInfo,
  validateExercises,
  validateForm,
} from './createWorkoutUtils';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'ios' },
  ToastAndroid: { SHORT: 0, show: jest.fn() },
}));

describe('createWorkoutUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = 'ios';
  });

  it('validates names and exercises with platform-appropriate messages', () => {
    expect(validateBasicInfo('  ')).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith('Missing Information', 'Please enter a workout name');
    (Platform as { OS: string }).OS = 'android';
    expect(validateBasicInfo('  ')).toBe(false);
    expect(ToastAndroid.show).toHaveBeenCalledWith('Please enter a workout name', ToastAndroid.SHORT);

    (Platform as { OS: string }).OS = 'ios';
    expect(validateExercises([])).toBe(false);
    expect(Alert.alert).toHaveBeenLastCalledWith('Missing Information', 'Add at least one exercise');
    expect(validateExercises([{ name: 'Squat', numSets: '', repRange: '8-12' } as never])).toBe(false);
    expect(Alert.alert).toHaveBeenLastCalledWith('Missing Information', 'Fill in sets and rep ranges for all exercises');

    (Platform as { OS: string }).OS = 'android';
    expect(validateExercises([{ name: 'Squat', numSets: '3', repRange: '' } as never])).toBe(false);
    expect(ToastAndroid.show).toHaveBeenLastCalledWith('Fill in sets and reps for all exercises', ToastAndroid.SHORT);
    expect(validateExercises([{ name: 'Squat', numSets: '3', repRange: '8-12' } as never])).toBe(true);
  });

  it('validates the full form without triggering UI feedback', () => {
    expect(validateForm(' ', [{ name: 'Squat', numSets: '3', repRange: '8-12' } as never])).toBe(false);
    expect(validateForm('Leg day', [])).toBe(false);
    expect(validateForm('Leg day', [{ name: 'Squat', numSets: '', repRange: '8-12' } as never])).toBe(false);
    expect(validateForm('Leg day', [{ name: 'Squat', numSets: '3', repRange: '8-12' } as never])).toBe(true);
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(ToastAndroid.show).not.toHaveBeenCalled();
  });

  it('converts arrays, a single selection, and invalid exercise selections', () => {
    expect(createExerciseFromSelection([{ name: 'Squat', muscleGroup: 'Legs' }, {}])).toEqual([
      {
        exerciseName: 'Squat', name: 'Squat', muscleGroup: 'Legs', category: '',
        imageURL: '', numSets: '', repRange: '', note: '',
      },
      {
        exerciseName: '', name: '', muscleGroup: '', category: '',
        imageURL: '', numSets: '', repRange: '', note: '',
      },
    ]);
    expect(createExerciseFromSelection({ name: 'Squat', category: 'Strength' })).toMatchObject({
      name: 'Squat', exerciseName: 'Squat', category: 'Strength', numSets: '3', repRange: '8-12',
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(createExerciseFromSelection(null)).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('normalizes template fields, defaults, duration, and preferred days', () => {
    const exercise = { name: 'Squat', numSets: '', repRange: '8-12' } as never;
    const result = createTemplateData('  Leg day  ', [exercise], '  easy  ', 45, ['Monday']);
    expect(result).toMatchObject({
      templateName: 'Leg day',
      exercises: [{
        exerciseName: 'Squat', imageURL: '', muscleGroup: '', category: '',
        numSets: '', repRange: '8-12', restTime: 180, note: '',
      }],
      exerciseCount: 1,
      duration: 45,
      note: 'easy',
      preferredDays: ['Monday'],
    });
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(createTemplateData('', [], '', undefined).duration).toBe(0);
  });
});
