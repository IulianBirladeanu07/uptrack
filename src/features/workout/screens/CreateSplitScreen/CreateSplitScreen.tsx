import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';
import {
  filterSplitSchedule,
  isWeeklyScheduleDay,
  updateSplitSchedule,
  type SplitSchedule,
} from './splitScheduleEditor';

type SplitFormData = {
  id?: string;
  name: string;
  description: string;
  type: string;
  schedule: SplitSchedule;
  durationWeeks?: number;
  [key: string]: any;
};

const isDayNumber = (v: string | number): boolean => Number.isInteger(Number(v)) && Number(v) > 0;
import { View, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BasicInfoStepJS from './steps/BasicInfoStep';
const BasicInfoStep = BasicInfoStepJS as any;
import ScheduleStepJS from './steps/ScheduleStep';
const ScheduleStep = ScheduleStepJS as any;
import ReviewStepJS from './steps/ReviewStep';
const ReviewStep = ReviewStepJS as any;

import { ProgressSteps } from '../CreateTemplateScreen/components/ProgressSteps';
import { NavigationButtons } from '../CreateTemplateScreen/components/NavigationButtons';
import { Header } from '../CreateTemplateScreen/components/Header';

import { fetchTemplatesFromFirestore } from '../../../workout/services/workoutTemplateService';
import { addSplitToFirestore, updateSplitInFirestore } from '../../../workout/services/workoutSplitService';
import { STEPS } from './constants/CreateSplitScreenConstants';
import { SPLIT_STEPS } from '../../utils/createWorkoutUtils';
import { hasScheduledWorkout } from '../../utils/splitSchedule';
import styles from './CreateSplitScreenStyles';
import { colors } from '../../../../shared/theme';

const CreateSplitScreen = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateSplit'>();
  const insets = useSafeAreaInsets();
  const split = (route.params?.split ?? null) as any;
  const isEditing = !!split;

  const [currentStep, setCurrentStep] = useState(0);
  const [splitData, setSplitData] = useState<SplitFormData>(
    isEditing
      ? {
          id: split.id,
          name: split.name || split.templateName || '',
          description: split.description || '',
          type: split.type || 'weekly',
          schedule: split.schedule || {},
        }
      : {
          name: '',
          description: '',
          type: 'weekly',
          schedule: {},
        }
  );

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(
    isEditing
      ? (split.type === 'rotation' ? 1 : 'monday')
      : 'monday'
  );

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      const loadWorkouts = async () => {
        setLoading(true);
        try {
          const templates = await fetchTemplatesFromFirestore();
          const normalizedWorkouts = templates.map((template, index) => ({
            id: template.id || `workout_${Date.now()}_${index}`,
            templateName: template.templateName || `Workout ${index + 1}`,
            duration: template.duration || 0,
            exercises: Array.isArray(template.exercises) ? template.exercises : [],
          }));
          if (isFocused) setWorkouts(normalizedWorkouts);
        } catch (error) {
          console.error('Error loading workouts:', error);
          if (isFocused) {
            Alert.alert('Error', 'Failed to load workout templates.');
            setWorkouts([]);
          }
        } finally {
          if (isFocused) setLoading(false);
        }
      };
      void loadWorkouts();
      return () => {
        isFocused = false;
      };
    }, [])
  );

  useEffect(() => {
    if (splitData.type === 'weekly') {
      if (!isEditing || (isEditing && split.type !== 'weekly')) {
        setSelectedDay('monday');
      }
      setSplitData(prev => {
        return {
          ...prev,
          schedule: filterSplitSchedule(prev.schedule, 'weekly'),
        };
      });
    } else if (splitData.type === 'rotation') {
      setSplitData(prev => {
        return {
          ...prev,
          schedule: filterSplitSchedule(prev.schedule, 'rotation'),
        };
      });

      if (!isEditing || (isEditing && split.type !== 'rotation')) {
        setSelectedDay(1);
        if (Object.keys(splitData.schedule).length === 0) {
          for (let i = 1; i <= 5; i++) {
            setSplitData(prev => ({
              ...prev,
              schedule: {
                ...prev.schedule,
                [i]: null,
              },
            }));
          }
        }
      }
    }
  }, [splitData.type, isEditing, split?.type]);

  const handleDayAssignment = useCallback((workout: {
    id?: string;
    templateName?: string;
    duration?: string | number;
    exercises?: unknown[];
  } | null, dayId: string | number) => {
    if (!dayId || (splitData.type === 'rotation' && !isDayNumber(dayId)) || (splitData.type === 'weekly' && !isWeeklyScheduleDay(dayId))) {
      console.error('Invalid dayId:', dayId);
      Alert.alert('Error', 'Invalid day selected for assignment.');
      return;
    }
    setSplitData(prev => ({
      ...prev,
      schedule: updateSplitSchedule(prev.schedule, { type: 'assign', workout, dayId }),
    }));
  }, [splitData.type]);

  const handleRemoveFromDay = useCallback((dayId: string | number) => {
    setSplitData(prev => {
      return {
        ...prev,
        schedule: updateSplitSchedule(prev.schedule, { type: 'clear', dayId }),
      };
    });
  }, []);

  const handleAddRotationDay = useCallback((dayNumber: number) => {
    if (!isDayNumber(dayNumber)) {
      console.error('Invalid dayNumber:', dayNumber);
      return;
    }
    setSplitData(prev => ({
      ...prev,
      schedule: updateSplitSchedule(prev.schedule, { type: 'addRotationDay', dayNumber }),
    }));
  }, []);

  const handleRemoveRotationDay = useCallback((dayNumber: number) => {
    if (!isDayNumber(dayNumber)) {
      console.error('Invalid dayNumber:', dayNumber);
      return;
    }

    setSplitData(prev => {
      return {
        ...prev,
        schedule: updateSplitSchedule(prev.schedule, { type: 'removeRotationDay', dayNumber }),
      };
    });
  }, []);

  const handleChange = useCallback((field: string, value: unknown) => {
    setSplitData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    if (currentStep === 0) return splitData.name.trim().length > 0;
    if (currentStep === 1) {
      const hasAssignedWorkouts = Object.values(splitData.schedule).some(hasScheduledWorkout);
      return hasAssignedWorkouts;
    }
    return true;
  }, [currentStep, splitData]);

  const handleSaveSplit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please assign at least one workout to a day.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateSplitInFirestore(String(splitData.id), splitData);
      } else {
        await addSplitToFirestore(splitData);
      }

      Alert.alert(
        'Success',
        `Split ${isEditing ? 'updated' : 'created'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (isEditing) {
                navigation.goBack();
              } else {
                navigation.navigate('WorkoutLibrary');
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} split:`, error);
      Alert.alert(
        'Error',
        (error as Error).message || `Failed to ${isEditing ? 'update' : 'create'} split. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [validateForm, navigation, splitData, isEditing]);

  const goToNextStep = useCallback(() => {
    if (validateForm()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      const errorMessage = currentStep === 0
        ? 'Please enter a split name.'
        : 'Please assign at least one workout.';
      Alert.alert('Missing Information', errorMessage);
    }
  }, [validateForm, currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  }, [currentStep, navigation]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <Header
        title={isEditing ? `Edit ${split?.name || 'Split'}` : STEPS[currentStep]?.title || 'Create Workout Split'}
        handleBackPress={goToPreviousStep}
      />
      <ProgressSteps currentStep={currentStep} steps={SPLIT_STEPS as any} />
      {loading && <ActivityIndicator size="large" color={colors.accent.primary} style={styles.loadingIndicator} />}

      {currentStep === 0 && (
        <BasicInfoStep
          splitData={splitData}
          handleChange={handleChange}
        />
      )}

      {currentStep === 1 && (
        <ScheduleStep
            splitData={splitData}
          workouts={workouts}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          handleDayAssignment={handleDayAssignment}
          handleRemoveWorkout={handleRemoveFromDay}
          handleAddRotationDay={handleAddRotationDay}
          handleRemoveRotationDay={handleRemoveRotationDay}
          navigation={navigation}
        />
      )}

      {currentStep === 2 && (
        <ReviewStep
          splitData={splitData}
          setCurrentStep={setCurrentStep}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        goToPreviousStep={goToPreviousStep}
        goToNextStep={goToNextStep}
        handleCreateSplit={handleSaveSplit}
        loading={loading}
        validateForm={validateForm}
        creationType="split"
        isEditing={isEditing}
      />
    </View>
  );
};

export default CreateSplitScreen;