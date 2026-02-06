import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import styles from './CreateWorkoutScreenStyle';
import BasicInfoStep from './steps/BasicInfoStep';
import ExercisesStep from './steps/ExercisesStep';
import ReviewStep from './steps/ReviewStep';
import ProgressSteps from './components/ProgressSteps';
import NavigationButtons from './components/NavigationButtons';
import Header from './components/Header';
import Notification from './components/Notification';

import { 
  validateBasicInfo, 
  validateExercises, 
  validateForm, 
  createExerciseFromSelection,
  createTemplateData, 
  TEMPLATE_STEPS
} from '../../utils/createWorkoutUtils';
import { addTemplateToFirestore, updateTemplateInFirestore } from '../../handlers/WorkoutHandler';

const CreateWorkout = ({ navigation, route }) => {
  const existingTemplate = route?.params?.template;
  const isEditing = route?.params?.isEditing || false;

  const [templateName, setTemplateName] = useState(existingTemplate?.templateName || '');
  const [exercises, setExercises] = useState(existingTemplate?.exercises || []);
  const [note, setNote] = useState(existingTemplate?.note || '');
  const [duration, setDuration] = useState(existingTemplate?.duration || 60);
  const [workoutType, setWorkoutType] = useState(existingTemplate?.workoutType || 'Strength');
  const [preferredDays, setPreferredDays] = useState(existingTemplate?.preferredDays || []);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [exerciseFadeAnims, setExerciseFadeAnims] = useState([]);
  const [undoState, setUndoState] = useState({
    type: null,
    exercise: null,
    index: null,
    animation: null,
    isActive: false,
  });
  const [notification, setNotification] = useState({
    message: '',
    isError: false,
    action: null,
    visible: false,
  });

  const fabAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (existingTemplate?.exercises) {
      const anims = existingTemplate.exercises.map(() => new Animated.Value(1));
      setExerciseFadeAnims(anims);
    }
  }, []);

  const showNotification = useCallback((message, isError = false, action = null) => {
    setNotification({ message, isError, action, visible: true });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
    setTimeout(() => {
      setUndoState((prev) => {
        if (prev.isActive) {
          return {
            type: null,
            exercise: null,
            index: null,
            animation: null,
            isActive: false,
          };
        }
        return prev;
      });
    }, 500);
  }, []);

  const memoizedSetTemplateName = useCallback((value) => setTemplateName(value), []);
  const memoizedSetNote = useCallback((value) => setNote(value), []);
  const memoizedSetDuration = useCallback((value) => setDuration(value), []);
  const memoizedSetWorkoutType = useCallback((value) => setWorkoutType(value), []);
  const memoizedSetPreferredDays = useCallback((value) => setPreferredDays(value), []);

  const handleBackPress = useCallback(() => {
    if (exercises.length > 0 || templateName.trim() !== '' || preferredDays.length > 0) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack()
          }
        ]
      );
      return true;
    }
    navigation.goBack();
    return true;
  }, [navigation, exercises.length, templateName, preferredDays]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(fabAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      backHandler.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [handleBackPress, fabAnim]);

  const safelyRunAnimation = (animValue, toValue, duration = 300) => {
    if (!animValue) return;
    try {
      return Animated.timing(animValue, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Animation error:', error);
    }
  };

  const undoDeleteExercise = useCallback(() => {
    setUndoState((currentUndoState) => {
      if (!currentUndoState.isActive || currentUndoState.type !== 'delete') return currentUndoState;
      const { exercise, index, animation } = currentUndoState;
      if (exercise && index !== null) {
        const newAnim = new Animated.Value(0);
        setExercises((prev) => {
          const newExercises = [...prev];
          newExercises.splice(index, 0, exercise);
          return newExercises;
        });
        setExerciseFadeAnims((prev) => {
          const newAnims = [...prev];
          newAnims.splice(index, 0, newAnim);
          return newAnims;
        });
        setTimeout(() => {
          safelyRunAnimation(newAnim, 1);
        }, 50);
        showNotification('Exercise restored successfully!');
      }
      return {
        type: null,
        exercise: null,
        index: null,
        animation: null,
        isActive: false,
      };
    });
  }, [showNotification]);

  const undoReplaceExercise = useCallback(() => {
    setUndoState((currentUndoState) => {
      if (!currentUndoState.isActive || currentUndoState.type !== 'replace') return currentUndoState;
      const { exercise, index, animation } = currentUndoState;
      if (exercise && index !== null) {
        const newAnim = new Animated.Value(0);
        setExercises((prev) => {
          if (index < prev.length) {
            const newExercises = [...prev];
            newExercises[index] = exercise;
            return newExercises;
          }
          return prev;
        });
        setExerciseFadeAnims((prev) => {
          if (index < prev.length) {
            const newAnims = [...prev];
            newAnims[index] = newAnim;
            return newAnims;
          }
          return prev;
        });
        setTimeout(() => {
          safelyRunAnimation(newAnim, 1);
        }, 50);
        showNotification('Exercise restored successfully!');
      }
      return {
        type: null,
        exercise: null,
        index: null,
        animation: null,
        isActive: false,
      };
    });
  }, [showNotification]);

  const handleReplaceExercise = useCallback((index) => {
    Keyboard.dismiss();
    navigation.navigate('ExerciseSelection', {
      previousScreen: 'CreateWorkout',
      replaceIndex: index,
    });
  }, [navigation]);

  const addExerciseWithAnimation = useCallback((exercise) => {
    if (!exercise) return;
    const isDuplicate = exercises.some(
      (existingExercise) =>
        (existingExercise.exerciseName || existingExercise.name) ===
        (exercise.exerciseName || exercise.name)
    );
    if (isDuplicate) {
      showNotification('This exercise is already added.', true);
      return;
    }
    const newAnim = new Animated.Value(0);
    setExercises((prev) => [...prev, exercise]);
    setExerciseFadeAnims((prev) => [...prev, newAnim]);
    setTimeout(() => {
      safelyRunAnimation(newAnim, 1);
    }, 50);
  }, [exercises, showNotification]);

  useEffect(() => {
    if (route.params?.selectedExercises) {
      const newExercises = createExerciseFromSelection(route.params.selectedExercises);
      const replaceIndex = route.params?.replaceIndex;
      navigation.setParams({ selectedExercises: null, replaceIndex: null });
      if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < exercises.length) {
        const exerciseToReplace = Array.isArray(newExercises) ? newExercises[0] : newExercises;
        if (
          exerciseToReplace &&
          typeof exerciseToReplace === 'object' &&
          (exerciseToReplace.exerciseName || exerciseToReplace.name)
        ) {
          const isDuplicate = exercises.some(
            (existingExercise, i) =>
              i !== replaceIndex &&
              (existingExercise.exerciseName || existingExercise.name) ===
              (exerciseToReplace.exerciseName || exerciseToReplace.name)
          );
          if (isDuplicate) {
            showNotification('This exercise is already added.', true);
            return;
          }
          setUndoState({
            type: 'replace',
            exercise: exercises[replaceIndex],
            index: replaceIndex,
            animation: exerciseFadeAnims[replaceIndex],
            isActive: true,
          });
          const newAnim = new Animated.Value(0);
          setExercises((prev) => {
            const newExercises = [...prev];
            newExercises[replaceIndex] = { ...exerciseToReplace, restTime: prev[replaceIndex]?.restTime || 180 };
            return newExercises;
          });
          setExerciseFadeAnims((prev) => {
            const newAnims = [...prev];
            newAnims[replaceIndex] = newAnim;
            return newAnims;
          });
          setTimeout(() => {
            safelyRunAnimation(newAnim, 1);
          }, 100);
          const originalExerciseName = exercises[replaceIndex]?.exerciseName || exercises[replaceIndex]?.name || 'Exercise';
          const newExerciseName = exerciseToReplace.exerciseName || exerciseToReplace.name || 'Exercise';
          showNotification(
            `Replaced "${originalExerciseName}" with "${newExerciseName}".`,
            false,
            { text: 'Undo', onPress: undoReplaceExercise }
          );
        } else {
          showNotification('Failed to replace exercise. Please try again.', true);
        }
      } else {
        if (Array.isArray(newExercises)) {
          newExercises.forEach((exercise) => {
            if (
              exercise &&
              typeof exercise === 'object' &&
              (exercise.exerciseName || exercise.name)
            ) {
              addExerciseWithAnimation({ ...exercise, restTime: 180 });
            }
          });
        } else if (
          newExercises &&
          typeof newExercises === 'object' &&
          (newExercises.exerciseName || newExercises.name)
        ) {
          addExerciseWithAnimation({ ...newExercises, restTime: 180 });
        }
      }
    }
  }, [
    route.params?.selectedExercises,
    route.params?.replaceIndex,
    exercises.length,
    addExerciseWithAnimation,
    exercises,
    exerciseFadeAnims,
    undoReplaceExercise,
    showNotification,
  ]);

  const handleAddExercise = useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('ExerciseSelection', {
      previousScreen: 'CreateWorkout',
    });
  }, [navigation]);

  const handleSetsChange = useCallback((value, index) => {
    setExercises((prev) => {
      const newExercises = [...prev];
      newExercises[index] = { ...newExercises[index], numSets: value };
      return newExercises;
    });
  }, []);

  const handleRepsChange = useCallback((value, index) => {
    setExercises((prev) => {
      const newExercises = [...prev];
      newExercises[index] = { ...newExercises[index], repRange: value };
      return newExercises;
    });
  }, []);

  const handleRestTimeChange = useCallback((value, index) => {
    setExercises((prev) => {
      const newExercises = [...prev];
      newExercises[index] = { ...newExercises[index], restTime: value };
      return newExercises;
    });
  }, []);

  const handleDeleteExercise = useCallback((index) => {
    if (index < 0 || index >= exercises.length) return;
    const exerciseToDelete = exercises[index];
    const animToDelete = exerciseFadeAnims[index];
    const exerciseName = exerciseToDelete?.exerciseName || exerciseToDelete?.name || 'Exercise';
    setUndoState({
      type: 'delete',
      exercise: exerciseToDelete,
      index: index,
      animation: animToDelete,
      isActive: true,
    });
    setExercises((prev) => {
      const newExercises = [...prev];
      newExercises.splice(index, 1);
      return newExercises;
    });
    setExerciseFadeAnims((prev) => {
      const newAnims = [...prev];
      newAnims.splice(index, 1);
      return newAnims;
    });
    showNotification(
      `Exercise "${exerciseName}" deleted.`,
      false,
      { text: 'Undo', onPress: undoDeleteExercise }
    );
  }, [exercises, exerciseFadeAnims, undoDeleteExercise, showNotification]);

  const handleNoteChange = useCallback((value, index) => {
    setExercises((prev) => {
      const newExercises = [...prev];
      newExercises[index] = { ...newExercises[index], note: value };
      return newExercises;
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    if (currentStep === 0) {
      if (!validateBasicInfo(templateName)) {
        return;
      }
    } else if (currentStep === 1) {
      if (!validateExercises(exercises)) {
        return;
      }
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, templateName, exercises]);

  const handleCreateTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const templateData = createTemplateData(templateName, exercises, note, duration, preferredDays);
      
      if (isEditing && existingTemplate?.id) {
        await updateTemplateInFirestore(existingTemplate.id, templateData);
        showNotification('Workout template updated successfully!');
      } else {
        await addTemplateToFirestore(templateData, templateName);
        showNotification('Workout template created successfully!');
      }
      
      navigation.navigate('WorkoutLibrary');
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification(`Failed to ${isEditing ? 'update' : 'create'} workout template. Please try again.`, true);
    } finally {
      setLoading(false);
    }
  }, [templateName, exercises, note, duration, preferredDays, navigation, showNotification, isEditing, existingTemplate]);

  const validateCurrentForm = useCallback(() => {
    return validateForm(templateName, exercises);
  }, [templateName, exercises]);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            templateName={templateName}
            setTemplateName={memoizedSetTemplateName}
            note={note}
            duration={duration}
            setNote={memoizedSetNote}
            setDuration={memoizedSetDuration}
            workoutType={workoutType}
            setWorkoutType={memoizedSetWorkoutType}
            preferredDays={preferredDays}
            setPreferredDays={memoizedSetPreferredDays}
          />
        );
      case 1:
        return (
          <ExercisesStep
            exercises={exercises}
            exerciseFadeAnims={exerciseFadeAnims || []}
            handleAddExercise={handleAddExercise}
            handleSetsChange={handleSetsChange}
            handleRepsChange={handleRepsChange}
            handleRestBetweenSetsChange={handleRestTimeChange}
            handleDeleteExercise={handleDeleteExercise}
            handleNoteChange={handleNoteChange}
            handleReplaceExercise={handleReplaceExercise}
            scrollViewRef={scrollViewRef}
          />
        );
      case 2:
        return (
          <ReviewStep
            templateName={templateName}
            setCurrentStep={setCurrentStep}
            exercises={exercises}
            duration={duration}
            note={note}
            preferredDays={preferredDays}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <GestureHandlerRootView style={styles.container}>
        <KeyboardAvoidingView style={styles.keyboardAvoidView} behavior="padding">
          <Header
            title={isEditing ? 'Edit Workout Template' : 'Create Workout Template'}
            handleBackPress={handleBackPress}
          />
          <ProgressSteps currentStep={currentStep} steps={TEMPLATE_STEPS} />
          <View style={styles.contentContainer}>
            {renderCurrentStep()}
          </View>
          <NavigationButtons
            currentStep={currentStep}
            goToPreviousStep={goToPreviousStep}
            goToNextStep={goToNextStep}
            handleCreateTemplate={handleCreateTemplate}
            loading={loading}
            validateForm={validateCurrentForm}
            isEditing={isEditing}
          />
          <Notification
            message={notification.message}
            isError={notification.isError}
            action={notification.action}
            visible={notification.visible}
            onDismiss={dismissNotification}
          />
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default CreateWorkout;