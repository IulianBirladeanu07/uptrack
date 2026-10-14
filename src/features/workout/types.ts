export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  isValidated: boolean;
  repsModified: boolean;
  weightModified?: boolean;
  isPR?: boolean;
  estimated1RM?: string | number;
};

export type WorkoutExercise = {
  exerciseName: string;
  name?: string;
  muscleGroup?: string;
  category?: string;
  imageURL?: string;
  numSets?: string | number;
  repRange?: string;
  note?: string;
  sets: WorkoutSet[];
  lastWorkoutSets?: WorkoutSet[];
  [key: string]: unknown;
};

export type TemplateExercise = {
  exerciseName?: string;
  name?: string;
  muscleGroup?: string;
  category?: string;
  imageURL?: string;
  numSets?: string | number;
  repRange?: string;
  restTime?: number;
  note?: string;
};

export type TemplateInput = Omit<WorkoutTemplate, 'exercises'> & {
  exercises: TemplateExercise[];
};

export type PersistedWorkoutState = {
  startTime: number;
  exercises: WorkoutExercise[];
  note: string;
  templateName: string;
  isActive: boolean;
  lastSaved: number;
};

export type WorkoutListener = (data: WorkoutExercise[]) => void;
export type TimerListener = (elapsedSeconds: number) => void;

export type NumericSet = {
  weight: number;
  reps: number;
  estimated1RM?: number;
  isValidated?: boolean;
  isPR?: boolean;
};

export type WorkoutTemplate = {
  id?: string;
  templateName: string;
  exercises: WorkoutExercise[];
  note?: string;
  duration?: string | number;
  preferredDays?: string[];
  uid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  workoutType?: string;
};

export type WorkoutSplitDay = {
  day?: string;
  workout?: unknown;
  isRestDay?: boolean;
  [key: string]: unknown;
};

export type WorkoutSplit = {
  id?: string;
  name?: string;
  splitName?: string;
  description?: string;
  type?: string;
  durationWeeks?: number;
  uid?: string;
  days?: WorkoutSplitDay[] | Record<string, unknown>;
  schedule?: Record<string, Record<string, unknown>> | unknown;
  currentWeek?: number;
  rotationStartDate?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  data?: unknown;
};

export type BodyMeasurements = {
  [key: string]: unknown;
};

export type CacheStatus = {
  catalogLoaded?: boolean;
  customLoaded?: boolean;
  imageCount?: number;
  hasMemoryCache?: boolean;
  memoryCacheAge?: number | null;
  memoryCacheSize?: number;
  isLoading?: boolean;
  [key: string]: unknown;
};
