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

export type DailySteps = Record<string, number>;

export type Numeric = number | string;

export type PlanType = 'weight_loss' | 'muscle_gain' | 'maintenance';

export type Macros = {
  protein: number;
  carbs: number;
  fats: number;
};

export type WeightChangePlan = {
  type: PlanType;
  ratePerWeek: number;
  ratePerMonth: number;
  goalCalories: number;
  macros: Macros;
  bmr: number;
  tdee: number;
  weeksToGoal: number;
  estimatedDate: string;
  isEstimate: boolean;
};

export type PlanFormData = {
  currentWeight?: Numeric | null;
  targetWeight?: Numeric | null;
  fitnessGoals?: PlanType | null;
  activityLevel?: string | null;
  gender?: string | null;
  height?: Numeric | null;
  age?: Numeric | null;
  stressLevel?: string | null;
  avgDailySteps?: number | null;
  experienceLevel?: string | null;
  autoAdjustEnabled?: boolean;
};

export type UserData = PlanFormData & {
  weightIns?: WeightInWeek[];
  weightChangePlan?: WeightChangePlan | null;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFats?: number | null;
  slowEvalPending?: boolean;
  planConfidence?: string | null;
  dailySteps?: DailySteps;
};

export type LegacyMaintenance = {
  maintenance: number;
  weeksUsed: number;
  avgCalories: number;
  rateKgPerWeek: number;
  windowed: boolean;
};

export type MaintenanceResult = MaintenanceEstimate | LegacyMaintenance;

export type PlanAdjustment = {
  suggestion: 'goal_reached' | 'hold' | 'increase_steps' | 'calorie_adjustment';
  planConfidence: 'calibrated' | 'estimated';
  measuredTDEE: number | null;
  targetRate?: number;
  syncedCalories?: number;
  syncedMacros?: Macros;
  suggestedStepsIncrease?: number;
  reason?: 'plateau_at_min_calories' | 'too_slow' | 'too_fast';
  adjustment?: number;
  newTargetCalories?: number;
  newMacros?: Macros;
  adjustedAt?: string;
  slowEvalPending?: boolean;
};
