export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  isValidated: boolean;
  repsModified: boolean;
  weightModified?: boolean;
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
  [key: string]: unknown;
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
