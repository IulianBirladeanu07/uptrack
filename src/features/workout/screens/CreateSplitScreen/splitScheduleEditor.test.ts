import { filterSplitSchedule, updateSplitSchedule, type SplitSchedule } from './splitScheduleEditor';

const initialSchedule: SplitSchedule = {
  monday: null,
  '1': null,
  other: null,
};

describe('updateSplitSchedule', () => {
  it('assigns a workout using the existing schedule projection and fallbacks', () => {
    const workout = {
      id: 'template-1',
      templateName: 'Push',
      duration: 0,
      exercises: [],
    };

    expect(updateSplitSchedule(initialSchedule, {
      type: 'assign',
      dayId: 'tuesday',
      workout,
    })).toEqual({
      ...initialSchedule,
      tuesday: {
        id: 'template-1',
        templateId: 'template-1',
        templateName: 'Push',
        duration: 0,
        exercises: [],
      },
    });
    expect(initialSchedule).not.toHaveProperty('tuesday');
  });

  it('uses null for cleared or added days, and deletes a removed rotation day', () => {
    expect(updateSplitSchedule(initialSchedule, {
      type: 'clear',
      dayId: 'monday',
    })).toMatchObject({ monday: null });
    expect(updateSplitSchedule(initialSchedule, {
      type: 'addRotationDay',
      dayNumber: 2,
    })).toMatchObject({ '2': null });
    expect(updateSplitSchedule(initialSchedule, {
      type: 'removeRotationDay',
      dayNumber: 1,
    })).not.toHaveProperty('1');
    expect(initialSchedule).toHaveProperty('1');
  });
});

describe('filterSplitSchedule', () => {
  it('keeps only recognized weekly day keys', () => {
    expect(filterSplitSchedule({
      monday: null,
      sunday: null,
      Monday: null,
      '1': null,
    }, 'weekly')).toEqual({
      monday: null,
      sunday: null,
    });
  });

  it('keeps positive integer rotation keys and ignores other entries', () => {
    expect(filterSplitSchedule({
      '1': null,
      '02': null,
      '0': null,
      '-1': null,
      '1.5': null,
      monday: null,
    }, 'rotation')).toEqual({
      '1': null,
      '02': null,
    });
  });
});
