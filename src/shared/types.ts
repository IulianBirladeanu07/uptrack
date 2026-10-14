import type { Tables } from './database.types';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WeightInWeek = {
  weekStart: string;
  createdAt?: string;
  average?: number | null;
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
  goalWeight?: number | null;
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
  email?: string;
  weightIns?: WeightInWeek[];
  weightChangePlan?: WeightChangePlan | null;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFats?: number | null;
  slowEvalPending?: boolean;
  planConfidence?: string | null;
  goalSwitchDate?: string | null;
  maintenanceCalories?: number | null;
  dailySteps?: DailySteps;
  weeklyNutrition?: WeeklySnapshot[];
  weeksSinceCutStart?: number;
  maintenanceUpdatedAt?: string | null;
  lastAdjustmentDate?: string | null;
  lastEvaluatedWeek?: string | null;
  lastCalorieAdjustment?: CalorieAdjustmentRecord | null;
  lastNutritionUpdate?: string;
  stepsBonusAppliedAt?: string | null;
  targetsSource?: 'formula' | 'learning';
  targetsInitializedAt?: string;
  startWeight?: Numeric;
  lastSnapshotWeek?: string;
  lastWeightUpdate?: string;
  weeklyTrend?: number | null;
  phaseHistory?: PhaseHistoryEntry[];
  profileSetupComplete?: boolean;
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

export type CalorieAdjustmentRecord = Omit<Partial<PlanAdjustment>, 'reason'> & {
  reason?: string;
  adjustedAt?: string;
};

export type PhaseHistoryEntry = {
  type: PlanType;
  startDate: string | null;
  endDate: string;
  weeks: number;
  startWeight: number;
  endWeight: number;
  avgKcal: number | null;
  strengthPct: number | null;
  weightPct: number | null;
};

export type FoodItem = {
  calories?: Numeric | null;
  protein?: Numeric | null;
  carbohydrates?: Numeric | null;
  fats?: Numeric | null;
};

export type DayMeals = Record<string, FoodItem[]>;

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WeeklySnapshot = {
  weekStart: string;
  daysLoggedNutrition: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFats: number;
  daysLoggedSteps: number;
  avgSteps: number;
  totalSteps: number;
  weightAverage: number | null;
  createdAt: string;
};

export type CatalogExercise = {
  name: string;
  muscleGroup: string;
  category: string;
  imageURL: string;
  equipment: string;
  difficulty: string;
};

export type ExerciseGroup = {
  muscleGroup: string;
  exercises: CatalogExercise[];
};

export type DateInput = Date | string | number;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type LoggedFood = FoodItem & {
  id: string;
  productName?: string;
  fiber?: Numeric | null;
  sugar?: Numeric | null;
  salt?: Numeric | null;
  saturatedFats?: Numeric | null;
  quantity?: Numeric;
  unit?: string;
  usageCount?: number;
  mealType?: string;
  timestamp?: unknown;
};

export type MealsByType = Record<MealType, LoggedFood[]>;

export type MealGroup = {
  date: string;
  mealType: MealType;
  foods: LoggedFood[];
};

export type RecentMeal = MealGroup & {
  id: string;
  totalCalories: number;
};

export type FoodCategoryName = 'Frequent' | 'Recent' | 'Favorites';

export type CategoryFood = RecentMeal | LoggedFood;

export type FoodCategoryData = {
  recentMeals?: RecentMeal[] | null;
  frequentFoods?: LoggedFood[] | null;
  favoriteFoods?: LoggedFood[] | null;
  loading?: boolean;
};

export type MealDayDoc = Partial<MealsByType> & {
  uid: string;
  date: string;
  timestamp?: unknown;
};

export type WeightDisplayData = {
  currentWeight: Numeric | null;
  weeklyAverage: number | null;
  lastWeekAverage: number | null;
  weeklyTrend: number | null;
  weighInCount: number;
};

export type HomeNotice = {
  id: string;
  type: 'calorie_adjustment' | 'goal_reached' | 'steps_permission';
  title: string;
  body: string;
  dismissKey?: string;
};

export type MealCacheLike = {
  getDateRange: (start: Date, end: Date) => { date: string; meals: DayMeals | null | undefined }[];
  getStepsRange: (start: Date, end: Date) => { date: string; steps: number }[];
  formatDate: (date: Date | string | number) => string;
};

export type FoodFormData = {
  productName?: string | null;
  calories?: Numeric | null;
  carbohydrates?: Numeric | null;
  protein?: Numeric | null;
  fats?: Numeric | null;
  fiber?: Numeric | null;
  sugar?: Numeric | null;
  saturatedFats?: Numeric | null;
  salt?: Numeric | null;
  amount?: Numeric | null;
  unit?: string | null;
  barcode?: string | null;
};

export type FoodFormErrors = Partial<Record<keyof FoodFormData | 'macroNutrients', string>>;

export type FormattedFoodData = {
  productName: string;
  calories: number;
  carbohydrates: number;
  fats: number;
  protein: number;
  fiber: number;
  sugar: number;
  salt: number;
  saturatedFats: number;
  quantity: number;
  unit: string;
  isFavorite: boolean;
  barcode?: string;
};

export type BarcodedProduct = Tables<'barcoded_products'>;

export type NonBarcodedProduct = Tables<'non_barcoded_products'>;

export type ScoredProduct = NonBarcodedProduct & {
  similarity_score: number;
  match_type: string;
};

export type ProductSearchResult = NonBarcodedProduct & Partial<Pick<ScoredProduct, 'similarity_score' | 'match_type'>>;

export type FoodSearchItem = {
  id: string;
  productName: string;
  productNameEn: string | null;
  productNameRo: string | null;
  category: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  sugar: number;
  salt: number;
  saturatedFats: number;
  image: string | null;
  lastUpdated: string;
  servingSize: { unit: string; value: number };
  relevanceScore: number;
  matchType: string;
};

export type FoodSuggestion = {
  id: string;
  productName: string | null;
  category: string | null;
  calories: number;
};

export type LearningData = {
  daysLogged?: number;
  weeklyAvgCalories?: number;
};

type FilterScalar = string | number;

export type ProductFilter =
  | [field: keyof NonBarcodedProduct, operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains', value: FilterScalar]
  | [field: keyof NonBarcodedProduct, operator: 'in', value: FilterScalar[]];

export type ProfileOption = {
  label: string;
  value: string;
  desc?: string;
};

export type OnboardingFormData = {
  unitSystem?: string;
  gender?: string;
  stressLevel?: string;
  experienceLevel?: string;
  activityLevel?: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  avgDailySteps?: number;
  height_feet?: number;
  height_inches?: number;
  currentWeight_lbs?: number;
  targetWeight_lbs?: number;
};

export type OnboardingChange = (key: string, value: string | number) => void;

export type UnitConfig = {
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
};

type OnboardingFieldBase = {
  title: string;
  description: string;
  skipIf?: (formData: OnboardingFormData) => boolean;
};

export type PickerField = OnboardingFieldBase & {
  type: 'picker';
  key: 'unitSystem' | 'gender' | 'stressLevel' | 'experienceLevel' | 'activityLevel';
  optionsKey: 'UNIT_OPTIONS' | 'GENDER_OPTIONS' | 'ACTIVITY_OPTIONS' | 'EXPERIENCE_OPTIONS' | 'STRESS_OPTIONS';
};

export type StepperField = OnboardingFieldBase & UnitConfig & {
  type: 'stepper';
  key: 'age' | 'avgDailySteps';
};

export type HeightField = OnboardingFieldBase & {
  type: 'unit_input';
  key: 'height';
  metric: UnitConfig;
  imperial: { feet: UnitConfig; inches: UnitConfig };
  convertToMetric: boolean;
};

export type WeightField = OnboardingFieldBase & {
  type: 'unit_input';
  key: 'currentWeight' | 'targetWeight';
  metric: UnitConfig;
  imperial: UnitConfig;
  convertToMetric: boolean;
};

export type OnboardingField = PickerField | StepperField | HeightField | WeightField;
