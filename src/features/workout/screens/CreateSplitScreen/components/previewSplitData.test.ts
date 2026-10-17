import { getPreviewSplitStats } from './previewSplitData';

describe('getPreviewSplitStats', () => {
  it('aggregates scheduled workouts and ignores rest days', () => {
    expect(getPreviewSplitStats({
      monday: {
        templateId: 'upper',
        duration: '45',
        exercises: [
          { numSets: 3, sets: 2, muscleGroup: 'Chest' },
          { numSets: '2.5', muscleGroup: 'Back' },
          { numSets: 'invalid', sets: '4', muscleGroup: 'Chest' },
        ],
      },
      tuesday: {
        templateId: 'rest-day',
        duration: 20,
        exercises: [{ numSets: 5, muscleGroup: 'Quads' }],
      },
      wednesday: {
        templateName: 'Workout',
        duration: 'invalid',
        exercises: [{ sets: 3, muscleGroup: 'Back' }],
      },
    }, null)).toEqual({
      selectedDayStats: null,
      compositionStats: {
        workoutDays: 2,
        totalSets: 12.5,
        totalDuration: 45,
      },
      muscleGroupSets: [
        { muscle: 'Chest', sets: 7 },
        { muscle: 'Back', sets: 5.5 },
      ],
      uncoveredMuscles: ['Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'],
    });
  });

  it('preserves the selected-day integer parsing and fallback behavior', () => {
    const workout = {
      templateId: 'upper',
      duration: 0,
      exercises: [
        { numSets: '2.5', sets: 7 },
        { numSets: 'invalid', sets: '4' },
        { sets: 3 },
      ],
    };

    expect(getPreviewSplitStats({ monday: workout }, workout).selectedDayStats).toEqual({
      duration: 45,
      exerciseCount: 3,
      totalSets: 9,
    });
  });

  it('returns empty composition and selected-day defaults', () => {
    expect(getPreviewSplitStats({}, null)).toEqual({
      selectedDayStats: null,
      compositionStats: { workoutDays: 0, totalSets: 0, totalDuration: 0 },
      muscleGroupSets: [],
      uncoveredMuscles: ['Chest', 'Back', 'Biceps', 'Quads', 'Hamstring', 'Delts', 'Triceps'],
    });
  });
});
