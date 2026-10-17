import type { WorkoutSplit, WorkoutTemplate } from '../types';
import { hydrateSplitSchedules, sanitizeSplitDay, sanitizeSplitSchedule } from './workoutSplitData';

describe('hydrateSplitSchedules', () => {
  it('uses current template details while preserving the split schedule metadata', () => {
    const split: WorkoutSplit = {
      id: 'split-1',
      schedule: {
        monday: {
          templateId: 'template-1',
          templateName: 'Old name',
          exercises: [{ exerciseName: 'Old exercise' }],
          duration: 30,
          customValue: true,
        },
        tuesday: {
          templateId: 'missing-template',
          templateName: 'Kept name',
        },
      },
    };
    const templates: WorkoutTemplate[] = [{
      id: 'template-1',
      templateName: 'Current name',
      exercises: [{ exerciseName: 'Current exercise', sets: [] }],
      duration: 45,
    }];

    const result = hydrateSplitSchedules([split], templates);

    expect(result[0].schedule).toEqual({
      monday: {
        templateId: 'template-1',
        id: 'template-1',
        templateName: 'Current name',
        exercises: templates[0].exercises,
        duration: 45,
        customValue: true,
      },
      tuesday: {
        templateId: 'missing-template',
        templateName: 'Kept name',
      },
    });
    expect(split.schedule?.['monday']?.['templateName']).toBe('Old name');
    expect(result[0]).not.toBe(split);
  });

  it('falls back to scheduled details when template fields are empty or absent', () => {
    const result = hydrateSplitSchedules([{
      schedule: {
        monday: {
          templateId: 'template-1',
          templateName: 'Scheduled name',
          exercises: [{ exerciseName: 'Scheduled exercise', sets: [] }],
          duration: 20,
        },
      },
    }], [{
      id: 'template-1',
      templateName: '',
      exercises: [],
      duration: 0,
    }]);

    expect(result[0].schedule?.['monday']).toMatchObject({
      id: 'template-1',
      templateName: 'Scheduled name',
      exercises: [],
      duration: 0,
    });
  });

  it('creates an empty schedule when persisted schedule is absent', () => {
    expect(hydrateSplitSchedules([{ id: 'split-1' }], [])[0].schedule).toEqual({});
  });
});

describe('split schedule sanitizers', () => {
  it('normalizes missing schedule days to rest-day records', () => {
    expect(sanitizeSplitSchedule({
      monday: null,
      tuesday: { templateId: 'template-1', templateName: 'Push', exercises: [], duration: '45' },
    })).toEqual({
      monday: {
        templateId: 'rest-day',
        templateName: 'Rest Day',
        exercises: [],
        duration: '0',
      },
      tuesday: {
        templateId: 'template-1',
        templateName: 'Push',
        exercises: [],
        duration: '45',
      },
    });
  });

  it('preserves provided truthy day data and applies existing fallback values', () => {
    expect(sanitizeSplitDay({
      templateId: '',
      templateName: '',
      exercises: null,
      duration: '',
    })).toEqual({
      templateId: 'rest-day',
      templateName: 'Rest Day',
      exercises: [],
      duration: '0',
    });
    expect(sanitizeSplitDay({
      templateId: 'template-1',
      templateName: 'Push',
      exercises: [{ exerciseName: 'Press' }],
      duration: 0,
    })).toEqual({
      templateId: 'template-1',
      templateName: 'Push',
      exercises: [{ exerciseName: 'Press' }],
      duration: '0',
    });
  });
});
