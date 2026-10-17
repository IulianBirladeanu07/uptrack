export type SplitScheduleDay = {
  id?: string | undefined;
  templateId?: string | undefined;
  templateName?: string | undefined;
  duration: string | number;
  exercises: unknown[];
  [key: string]: unknown;
};

export type SplitSchedule = Record<string, SplitScheduleDay | null>;

type ScheduleWorkout = {
  id?: string;
  templateName?: string;
  duration?: string | number;
  exercises?: unknown[];
};

type SplitScheduleAction =
  | { type: 'assign'; dayId: string | number; workout: ScheduleWorkout | null }
  | { type: 'clear'; dayId: string | number }
  | { type: 'addRotationDay'; dayNumber: number }
  | { type: 'removeRotationDay'; dayNumber: number };

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const isWeeklyScheduleDay = (dayId: string | number): boolean =>
  WEEK_DAYS.includes(String(dayId));

export const updateSplitSchedule = (
  schedule: SplitSchedule,
  action: SplitScheduleAction,
): SplitSchedule => {
  switch (action.type) {
    case 'assign': {
      const { workout, dayId } = action;
      return {
        ...schedule,
        [dayId]: workout
          ? {
            id: workout.id,
            templateId: workout.id,
            templateName: workout.templateName,
            duration: workout.duration || 0,
            exercises: workout.exercises || [],
          }
          : null,
      };
    }
    case 'clear':
      return { ...schedule, [action.dayId]: null };
    case 'addRotationDay':
      return { ...schedule, [action.dayNumber]: null };
    case 'removeRotationDay': {
      const nextSchedule = { ...schedule };
      delete nextSchedule[action.dayNumber];
      return nextSchedule;
    }
  }
};

export const filterSplitSchedule = (
  schedule: SplitSchedule,
  type: 'weekly' | 'rotation',
): SplitSchedule => Object.keys(schedule).reduce<SplitSchedule>((filtered, key) => {
  const isAllowed = type === 'weekly'
    ? isWeeklyScheduleDay(key)
    : Number.isInteger(Number(key)) && Number(key) > 0;
  if (isAllowed) filtered[key] = schedule[key];
  return filtered;
}, {});
