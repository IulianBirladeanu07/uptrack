import type { OnboardingFormData, WeightInWeek } from '../types';
import type { WorkoutSplit } from '../../features/workout/types';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  AuthenticatedScreens: undefined;
  OnboardingFlow: undefined;
  PlanSummary: { formData?: OnboardingFormData };
};

export type AuthenticatedStackParamList = {
  Dashboard: undefined;
  Nutrition: { refresh?: boolean; meal?: string } | undefined;
  Workout: undefined;
  Progress: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  WorkoutHistory: undefined;
  WorkoutDetails: {
    duration?: string;
    notes?: string;
    exercises?: unknown[];
    timestamp?: string;
    workoutName?: string | null;
  };
  StartWorkout: {
    selectedWorkout?: unknown;
    exercises?: unknown[];
    templateName?: string;
    isRestDay?: boolean;
    selectedExercises?: unknown[];
    selectedExercise?: string;
  } | undefined;
  ExerciseSelection: {
    previousScreen?: 'StartWorkout' | 'CreateTemplate';
    replaceIndex?: string | null;
  } | undefined;
  WorkoutLibrary: {
    initialSegment?: 'Templates' | 'Splits';
  } | undefined;
  CreateTemplate: {
    template?: unknown;
    isEditing?: boolean;
    selectedExercises?: unknown[] | null;
    replaceIndex?: string | null;
  } | undefined;
  FoodSelection: {
    meal?: string;
    selectedDate?: string;
    selectedFoodDetail?: unknown;
    refresh?: boolean;
    remainingCalories?: number;
  } | undefined;
  BarcodeScanner: {
    meal?: string | undefined;
    selectedDate?: string | undefined;
  } | undefined;
  FoodDetail: {
    food?: unknown;
    meal?: string | undefined;
    selectedDate?: string | undefined;
    update?: boolean;
    foodId?: string | undefined;
    remainingCalories?: number;
  };
  CustomFood: {
    type?: string;
    barcode?: string;
    meal?: string | undefined;
    selectedDate?: string | undefined;
  } | undefined;
  CreateSplit: {
    split?: WorkoutSplit;
  } | undefined;
  WeightTracker: {
    initialDate?: string;
  } | undefined;
  PreviewSplit: {
    splitData?: WorkoutSplit;
  } | undefined;
  CreateExercise: {
    onExerciseCreated?: (exercise: unknown) => void;
  } | undefined;
  WeightHistory: {
    weightIns?: WeightInWeek[];
    isBulking?: boolean | undefined;
    startWeight?: number | null | undefined;
    goalWeight?: number | null | undefined;
  } | undefined;
  ExerciseHistory: {
    exerciseName: string;
    muscleGroup?: string;
  };
};
