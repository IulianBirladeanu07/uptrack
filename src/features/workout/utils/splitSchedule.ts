type ScheduleDay = {
  id?: string | undefined;
  templateId?: string | undefined;
  templateName?: string | undefined;
  exercises?: unknown[] | undefined;
} & Record<string, unknown>;
type Schedule = Record<string, ScheduleDay | null | undefined>;

export type SplitLike = {
  type?: string;
  schedule?: Schedule | null;
  data?: { type?: string; schedule?: Schedule | null } | null;
} | null | undefined;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEK_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_MS = 86400000;

const pad = (n: number): string => String(n).padStart(2, '0');

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dayNumberOf = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

const keyDayNumber = (key: unknown): number | null => {
  if (typeof key !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const n = Date.UTC(y, mo - 1, d);
  const check = new Date(n);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return n / DAY_MS;
};

const scheduleOf = (split: SplitLike): Schedule => split?.schedule ?? split?.data?.schedule ?? {};

const typeOf = (split: SplitLike): string | undefined => split?.type ?? split?.data?.type;

export const hasScheduledWorkout = (day: ScheduleDay | null | undefined): boolean => {
  if (!day || day.templateId === 'rest-day' || day.templateName?.toLowerCase() === 'rest day') return false;
  if (Array.isArray(day.exercises)) return day.exercises.length > 0;
  return !!(day.templateId || day.id);
};

export const isRotationSplit = (split: SplitLike): boolean => typeOf(split) === 'rotation';

export const getCycleLength = (split: SplitLike): number => {
  let max = 0;
  Object.keys(scheduleOf(split)).forEach(k => {
    const n = Number(k);
    if (Number.isInteger(n) && n > max) max = n;
  });
  return max;
};

export const getRotationDayNumber = (split: SplitLike, date: Date, rotationStartDate: unknown): number | null => {
  const n = getCycleLength(split);
  const start = keyDayNumber(rotationStartDate);
  if (n < 1 || start == null) return null;
  const diff = dayNumberOf(date) - start;
  return (((diff % n) + n) % n) + 1;
};

export const getScheduledDay = (split: SplitLike, date: Date, rotationStartDate?: unknown): ScheduleDay | null => {
  const schedule = scheduleOf(split);
  if (isRotationSplit(split)) {
    const num = getRotationDayNumber(split, date, rotationStartDate);
    return num == null ? null : schedule[String(num)] ?? null;
  }
  return schedule[WEEKDAYS[date.getDay()]] ?? null;
};

export const getWeekSchedule = (split: SplitLike, today: Date, rotationStartDate?: unknown): Schedule => {
  if (!isRotationSplit(split)) return scheduleOf(split);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week: Schedule = {};
  WEEK_ORDER.forEach((key, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    week[key] = getScheduledDay(split, d, rotationStartDate);
  });
  return week;
};

export const getWorkoutsPerWeek = (split: SplitLike): number => {
  const count = Object.values(scheduleOf(split)).filter(d => (d?.exercises?.length ?? 0) > 0).length;
  if (!isRotationSplit(split)) return count;
  const n = getCycleLength(split);
  return n > 0 ? Math.round((count * 7) / n) : 0;
};
