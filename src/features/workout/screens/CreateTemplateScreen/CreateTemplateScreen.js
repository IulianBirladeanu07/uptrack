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
import styles from './CreateTemplateScreenStyle';
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

const generateExerciseId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const CreateTemplate = ({ navigation, route }) => {
  const existingTemplate = route?.params?.template;
  const isEditing = route?.params?.isEditing || false;

  const [templateName, setTemplateName] = useState(existingTemplate?.templateName || '');
  const [exercises, setExercises] = useState(() =>
    (existingTemplate?.exercises || []).map((ex) => ({
      ...ex,
      id: ex.id || generateExerciseId(),
    }))
  );
  const [note, setNote] = useState(existingTemplate?.note || '');
  const [duration, setDuration] = useState(existingTemplate?.duration || 60);
  const [workoutType, setWorkoutType] = useState(existingTemplate?.workoutType || 'Strength');
  const [preferredDays, setPreferredDays] = useState(existingTemplate?.preferredDays || []);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [undoState, setUndoState] = useState({
    type: null,
    exercise: null,
    index: null,
    replacedWithId: null,
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
  const exercisesRef = useRef(exercises);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

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
            replacedWithId: null,
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
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return true;
    }
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
  }, [navigation, currentStep, exercises.length, templateName, preferredDays]);

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

  const undoDeleteExercise = useCallback(() => {
    setUndoState((currentUndoState) => {
      if (!currentUndoState.isActive || currentUndoState.type !== 'delete') return currentUndoState;
      const { exercise, index } = currentUndoState;
      if (exercise && index !== null) {
        setExercises((prev) => {
          const newExercises = [...prev];
          newExercises.splice(index, 0, exercise);
          return newExercises;
        });
        showNotification('Exercise restored successfully!');
      }
      return {
        type: null,
        exercise: null,
        index: null,
        replacedWithId: null,
        isActive: false,
      };
    });
  }, [showNotification]);

  const undoReplaceExercise = useCallback(() => {
    setUndoState((currentUndoState) => {
      if (!currentUndoState.isActive || currentUndoState.type !== 'replace') return currentUndoState;
      const { exercise, replacedWithId } = currentUndoState;
      if (exercise && replacedWithId) {
        setExercises((prev) => {
          const currentIdx = prev.findIndex((ex) => ex.id === replacedWithId);
          if (currentIdx === -1) return prev;
          const next = [...prev];
          next[currentIdx] = exercise;
          return next;
        });
        showNotification('Exercise restored successfully!');
      }
      return {
        type: null,
        exercise: null,
        index: null,
        replacedWithId: null,
        isActive: false,
      };
    });
  }, [showNotification]);

  const handleReplaceExercise = useCallback((id) => {
    Keyboard.dismiss();
    navigation.navigate('ExerciseSelection', {
      previousScreen: 'CreateTemplate',
      replaceIndex: id,
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
    const newId = generateExerciseId();
    setExercises((prev) => [...prev, { ...exercise, id: newId }]);
  }, [exercises, showNotification]);

  useEffect(() => {
    if (route.params?.selectedExercises) {
      const newExercises = createExerciseFromSelection(route.params.selectedExercises);
      const replaceExerciseId = route.params?.replaceIndex;
      navigation.setParams({ selectedExercises: null, replaceIndex: null });
      if (replaceExerciseId) {
        const exerciseToReplace = Array.isArray(newExercises) ? newExercises[0] : newExercises;
        if (
          exerciseToReplace &&
          typeof exerciseToReplace === 'object' &&
          (exerciseToReplace.exerciseName || exerciseToReplace.name)
        ) {
          const currentIndex = exercises.findIndex((ex) => ex.id === replaceExerciseId);
          if (currentIndex === -1) {
            showNotification('Failed to replace exercise. Please try again.', true);
            return;
          }
          const isDuplicate = exercises.some(
            (existingExercise) =>
              existingExercise.id !== replaceExerciseId &&
              (existingExercise.exerciseName || existingExercise.name) ===
              (exerciseToReplace.exerciseName || exerciseToReplace.name)
          );
          if (isDuplicate) {
            showNotification('This exercise is already added.', true);
            return;
          }
          const originalExercise = exercises[currentIndex];
          const newId = generateExerciseId();
          setUndoState({
            type: 'replace',
            exercise: originalExercise,
            replacedWithId: newId,
            index: currentIndex,
            isActive: true,
          });
          setExercises((prev) => prev.map((ex) => ex.id === replaceExerciseId
            ? { ...exerciseToReplace, id: newId, restTime: ex.restTime || 180 }
            : ex
          ));
          const originalExerciseName = originalExercise?.exerciseName || originalExercise?.name || 'Exercise';
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
    exercises,
    addExerciseWithAnimation,
    undoReplaceExercise,
    showNotification,
  ]);

  const handleAddExercise = useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('ExerciseSelection', {
      previousScreen: 'CreateTemplate',
    });
  }, [navigation]);

  const handleSetsChange = useCallback((value, id) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, numSets: value } : ex)));
  }, []);

  const handleRepsChange = useCallback((value, id) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, repRange: value } : ex)));
  }, []);

  const handleRestTimeChange = useCallback((value, id) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, restTime: value } : ex)));
  }, []);

  const handleDeleteExercise = useCallback((id) => {
    const currentExercises = exercisesRef.current;
    const idx = currentExercises.findIndex((ex) => ex.id === id);
    if (idx === -1) return;
    const exerciseToDelete = currentExercises[idx];
    setUndoState({
      type: 'delete',
      exercise: exerciseToDelete,
      index: idx,
      replacedWithId: null,
      isActive: true,
    });
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    const exerciseName = exerciseToDelete?.exerciseName || exerciseToDelete?.name || 'Exercise';
    showNotification(
      `Exercise "${exerciseName}" deleted.`,
      false,
      { text: 'Undo', onPress: undoDeleteExercise }
    );
  }, [undoDeleteExercise, showNotification]);

  const handleNoteChange = useCallback((value, id) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, note: value } : ex)));
  }, []);

  const handleReorderExercises = useCallback(({ data }) => {
    setExercises(data);
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
            handleAddExercise={handleAddExercise}
            handleSetsChange={handleSetsChange}
            handleRepsChange={handleRepsChange}
            handleRestBetweenSetsChange={handleRestTimeChange}
            handleDeleteExercise={handleDeleteExercise}
            handleNoteChange={handleNoteChange}
            handleReplaceExercise={handleReplaceExercise}
            handleReorderExercises={handleReorderExercises}
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

export default CreateTemplate;