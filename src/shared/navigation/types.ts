export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  AuthenticatedScreens: undefined;
  OnboardingFlow: undefined;
  PlanSummary: { formData?: Record<string, unknown> };
};

export type AuthenticatedStackParamList = {
  Dashboard: undefined;
  Nutrition: { refresh?: boolean } | undefined;
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
  } | undefined;
  ExerciseSelection: {
    onExercisesSelected?: (exercises: unknown[]) => void;
    selectedExercises?: unknown[];
    previousScreen?: string;
  } | undefined;
  WorkoutLibrary: undefined;
  CreateTemplate: {
    template?: unknown;
    isEditing?: boolean;
    selectedExercises?: unknown[];
  } | undefined;
  FoodSelection: {
    meal?: string;
    selectedDate?: string;
    selectedFoodDetail?: unknown;
  } | undefined;
  BarcodeScanner: {
    meal?: string;
    selectedDate?: string;
  } | undefined;
  FoodDetail: {
    food?: unknown;
    meal?: string | undefined;
    selectedDate?: string | undefined;
    update?: boolean;
    foodId?: string;
    remainingCalories?: number;
    returnToBarcodeScanner?: boolean;
    refreshBarcodedProducts?: boolean;
  };
  CustomFood: {
    type?: string;
    barcode?: string;
    meal?: string | undefined;
    selectedDate?: string | undefined;
  } | undefined;
  CreateSplit: {
    split?: unknown;
    isEditing?: boolean;
  } | undefined;
  WeightTracker: {
    initialDate?: string;
  } | undefined;
  PreviewSplit: {
    splitData?: unknown;
  } | undefined;
  CreateExercise: {
    onExerciseCreated?: (exercise: unknown) => void;
  } | undefined;
  WeightHistory: {
    weightIns?: unknown[];
    isBulking?: boolean;
    startWeight?: number;
    goalWeight?: number;
  } | undefined;
  ExerciseHistory: {
    exerciseName: string;
  };
};
