import type { WorkoutSplit, WorkoutTemplate } from '../types';

type SplitSchedule = Record<string, Record<string, unknown>>;

export const hydrateSplitSchedules = (
  splits: WorkoutSplit[],
  templates: WorkoutTemplate[],
): WorkoutSplit[] => {
  const templateMap = new Map(templates.map(template => [template.id, template]));

  return splits.map(split => {
    const schedule = (split.schedule || {}) as SplitSchedule;
    const hydratedSchedule: SplitSchedule = {};

    Object.keys(schedule).forEach(day => {
      const dayData = schedule[day] || {};
      const templateId = dayData['templateId'] as string | undefined;
      const template = templateId ? templateMap.get(templateId) : undefined;
      hydratedSchedule[day] = template
        ? {
          ...dayData,
          id: template.id ?? templateId,
          templateName: template.templateName || dayData['templateName'],
          exercises: template.exercises || dayData['exercises'],
          duration: template.duration ?? dayData['duration'],
        }
        : dayData;
    });

    return { ...split, schedule: hydratedSchedule };
  });
};

export const sanitizeSplitSchedule = (
  input: WorkoutSplit['schedule'],
): SplitSchedule => {
  const sanitized: SplitSchedule = {};
  const schedule = (input || {}) as SplitSchedule;

  Object.keys(schedule).forEach(day => {
    const dayData = schedule[day] || {};
    sanitized[day] = {
      templateId: dayData['templateId'] || 'rest-day',
      templateName: dayData['templateName'] || 'Rest Day',
      exercises: dayData['exercises'] || [],
      duration: dayData['duration'] || '0',
    };
  });

  return sanitized;
};

export const sanitizeSplitDay = (
  workoutData: Record<string, unknown>,
): Record<string, unknown> => ({
  templateId: workoutData['templateId'] || 'rest-day',
  templateName: workoutData['templateName'] || 'Rest Day',
  exercises: workoutData['exercises'] || [],
  duration: workoutData['duration'] || '0',
});
