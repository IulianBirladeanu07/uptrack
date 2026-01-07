import { Platform, Alert, ToastAndroid } from 'react-native';

// Step definitions
export const TEMPLATE_STEPS = [
  { icon: 'create-outline', title: 'Basic Info' },
  { icon: 'barbell-outline', title: 'Exercises' },
  { icon: 'checkmark-circle-outline', title: 'Review' }
];

export const SPLIT_STEPS = [
  { id: 'basic-info', icon: 'create-outline', title: 'Basic Info' },
  { id: 'schedule', icon: 'calendar-outline', title: 'Schedule' },
  { id: 'review', icon: 'checkmark-circle-outline', title: 'Review' }
];


export const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

// Validation functions
export const validateBasicInfo = (templateName) => {
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

export const validateExercises = (exercises) => {
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

export const validateForm = (templateName, exercises) => {
  return templateName.trim() && 
         exercises.length > 0 && 
         !exercises.find(ex => !ex.numSets || !ex.repRange);
};

// Common UI notification function
export const showNotification = (message, isError = false) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, isError ? ToastAndroid.LONG : ToastAndroid.SHORT);
  } else {
    Alert.alert(isError ? 'Error' : 'Success', message);
  }
};

export const createExerciseFromSelection = (selectedExercises) => {
  // Handle array of exercises or single exercise
  if (Array.isArray(selectedExercises)) {
    // Handle multiple exercises
    return selectedExercises.map(exercise => ({
      exerciseName: exercise.name || '',
      name: exercise.name || '',
      muscleGroup: exercise.muscleGroup || '',
      category: exercise.category || '',
      imageURL: exercise.imageURL || '',
      numSets: '', // Default values
      repRange: '', // Default values
      note: '',
    }));
  } else if (selectedExercises && typeof selectedExercises === 'object') {
    // Handle single exercise
    return {
      exerciseName: selectedExercises.name || '',
      name: selectedExercises.name || '',
      muscleGroup: selectedExercises.muscleGroup || '',
      category: selectedExercises.category || '',
      imageURL: selectedExercises.imageURL || '',
      numSets: '3', // Default values
      repRange: '8-12', // Default values
      note: '',
    };
  }
  
  console.error('Invalid selected exercise format:', selectedExercises);
  return null;
};

export const createTemplateData = (templateName, exercises, note, duration, preferredDays) => ({
  templateName: templateName.trim(),
  exercises: exercises.map(ex => ({
    exerciseName: ex.name || ex.exerciseName || '',
    imageURL: ex.imageURL || '',
    muscleGroup: ex.muscleGroup || '',
    category: ex.category || '',
    numSets: ex.numSets || '',
    repRange: ex.repRange || '',
    restBetweenSets: ex.restBetweenSets || '',
    note: ex.note || ''
  })),
  exerciseCount: exercises.length,
  duration: duration || 0,
  note: note.trim(),
  preferredDays: preferredDays || [],
  createdAt: new Date()
});