export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WeightInWeek = {
  weekStart: string;
  days?: Partial<Record<DayKey, number | string | null>>;
};

export type WeightEntry = {
  date: Date;
  weight: number;
};

export type WeekStats = {
  weekStart: string;
  daysLogged: number;
  avgCalories: number;
  avgSteps?: number | null;
  daysLoggedSteps?: number | null;
};

export type MaintenanceEstimate = {
  maintenance: number;
  se: number;
  margin: number;
  weeksUsed: number;
  avgCalories: number;
  rateKgPerWeek: number;
  weighIns: number;
  windowed: true;
};

export type TrendPoint = {
  date: Date;
  rawWeight: number;
  trendWeight: number;
};

export type StatusBadge = {
  type: 'good' | 'warn' | 'bad';
  icon: string;
  label: string;
  message: string;
};
