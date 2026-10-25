import type { ComponentProps } from 'react';
import { Platform, Alert, ToastAndroid } from 'react-native';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { CatalogExercise } from '../../../shared/types';
import type { TemplateExercise } from '../types';

type StepIcon = ComponentProps<typeof Ionicons>['name'];

export const TEMPLATE_STEPS: { icon: StepIcon; title: string }[] = [
  { icon: 'create-outline', title: 'Basic Info' },
  { icon: 'barbell-outline', title: 'Exercises' },
  { icon: 'checkmark-circle-outline', title: 'Review' }
];

export const SPLIT_STEPS: { id: string; icon: StepIcon; title: string }[] = [
  { id: 'basic-info', icon: 'create-outline', title: 'Basic Info' },
  { id: 'schedule', icon: 'calendar-outline', title: 'Schedule' },
  { id: 'review', icon: 'checkmark-circle-outline', title: 'Review' }
];

export const validateBasicInfo = (templateName: string): boolean => {
  if (!templateName.trim()) {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Please enter a workout name', ToastAndroid.SHORT);
    } else {
      Alert.alert('Missing Information', 'Please enter a workout name');
    }
    return false;
  }
  return true;
};

export const validateExercises = (exercises: TemplateExercise[]): boolean => {
  if (exercises.length === 0) {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Add at least one exercise', ToastAndroid.SHORT);
    } else {
      Alert.alert('Missing Information', 'Add at least one exercise');
    }
    return false;
  }

  const incompleteExercise = exercises.find(ex => !ex.numSets || !ex.repRange);
  if (incompleteExercise) {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Fill in sets and reps for all exercises', ToastAndroid.SHORT);
    } else {
      Alert.alert('Missing Information', 'Fill in sets and rep ranges for all exercises');
    }
    return false;
  }

  return true;
};

export const validateForm = (templateName: string, exercises: TemplateExercise[]) => {
  return !!(templateName.trim() &&
         exercises.length > 0 &&
         !exercises.find(ex => !ex.numSets || !ex.repRange));
};


export const createExerciseFromSelection = (
  selectedExercises: Partial<CatalogExercise>[] | Partial<CatalogExercise> | null | undefined
): TemplateExercise[] | TemplateExercise | null => {

  if (Array.isArray(selectedExercises)) {

    return selectedExercises.map(exercise => ({
      exerciseName: exercise.name || '',
      name: exercise.name || '',
      muscleGroup: exercise.muscleGroup || '',
      category: exercise.category || '',
      imageURL: exercise.imageURL || '',
      numSets: '',
      repRange: '',
      note: '',
    }));
  } else if (selectedExercises && typeof selectedExercises === 'object') {

    return {
      exerciseName: selectedExercises.name || '',
      name: selectedExercises.name || '',
      muscleGroup: selectedExercises.muscleGroup || '',
      category: selectedExercises.category || '',
      imageURL: selectedExercises.imageURL || '',
      numSets: '3',
      repRange: '8-12',
      note: '',
    };
  }

  console.error('Invalid selected exercise format:', selectedExercises);
  return null;
};

export const createTemplateData = (
  templateName: string,
  exercises: TemplateExercise[],
  note: string,
  duration?: string | number,
  preferredDays?: string[]
) => ({
  templateName: templateName.trim(),
  exercises: exercises.map(ex => ({
    exerciseName: ex.name || ex.exerciseName || '',
    imageURL: ex.imageURL || '',
    muscleGroup: ex.muscleGroup || '',
    category: ex.category || '',
    numSets: ex.numSets || '',
    repRange: ex.repRange || '',
    restTime: ex.restTime || 180,
    note: ex.note || ''
  })),
  exerciseCount: exercises.length,
  duration: duration || 0,
  note: note.trim(),
  preferredDays: preferredDays || [],
  createdAt: new Date()
});
