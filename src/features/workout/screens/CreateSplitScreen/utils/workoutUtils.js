// src/screens/CreateSplitScreen/utils/WorkoutUtils.js
export const generateWorkoutId = (workout, index) => {
  const baseName = (workout.templateName || workout.name || 'workout').toLowerCase().replace(/\s+/g, '_');
  return `${baseName}_${index}`;
};