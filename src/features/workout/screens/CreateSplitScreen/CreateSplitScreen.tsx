// @ts-nocheck — refine types in follow-up (nav hooks in place)
import { useState, useEffect, useCallback } from 'react';
import { useAppNavigation, useAppRoute } from '../../../../shared/navigation';

type SplitFormData = {
  id?: string;
  name: string;
  description: string;
  type: string;
  schedule: any;
  durationWeeks?: number;
  [key: string]: any;
};
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

import { fetchTemplatesFromFirestore, addSplitToFirestore, updateSplitInFirestore } from '../../../workout/handlers/WorkoutHandler';
import { STEPS } from './constants/CreateSplitScreenConstants';
import { SPLIT_STEPS } from '../../utils/createWorkoutUtils';
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

  useEffect(() => {
    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const templates = await fetchTemplatesFromFirestore() as Promise<any[]>;
        const normalizedWorkouts = templates.map((template, index) => {
          const templateData = template.data || template;
          return {
            id: templateData.id || `workout_${Date.now()}_${index}`,
            templateName: templateData.templateName || `Workout ${index + 1}`,
            duration: templateData.duration || 0,
            exercises: Array.isArray(templateData.exercises) ? templateData.exercises : [],
          };
        });
        setWorkouts(normalizedWorkouts);
      } catch (error) {
        console.error('Error loading workouts:', error);
        Alert.alert('Error', 'Failed to load workout templates.');
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };
    loadWorkouts();
  }, []);

  useEffect(() => {
    if (splitData.type === 'weekly') {
      if (!isEditing || (isEditing && split.type !== 'weekly')) {
        setSelectedDay('monday');
      }
      setSplitData(prev => {
        const cleanedSchedule = {};
        Object.keys(prev.schedule).forEach(key => {
          if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key)) {
            cleanedSchedule[key] = prev.schedule[key];
          }
        });
        return {
          ...prev,
          schedule: cleanedSchedule,
        };
      });
    } else if (splitData.type === 'rotation') {
      setSplitData(prev => {
        const cleanedSchedule = {};
        Object.keys(prev.schedule).forEach(key => {
          if (!isNaN(key) && parseInt(key) > 0) {
            cleanedSchedule[key] = prev.schedule[key];
          }
        });
        return {
          ...prev,
          schedule: cleanedSchedule,
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

  const handleDayAssignment = useCallback((workout: any, dayId: string | number) => {
    if (!dayId || (splitData.type === 'rotation' && isNaN(dayId)) || (splitData.type === 'weekly' && !['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dayId))) {
      console.error('Invalid dayId:', dayId);
      Alert.alert('Error', 'Invalid day selected for assignment.');
      return;
    }
    setSplitData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayId]: workout
          ? {
              id: workout.id,
              templateId: workout.id,
              templateName: workout.templateName,
              duration: workout.duration || 0,
              exercises: workout.exercises || [],
            }
          : null,
      },
    }));
  }, [splitData.type]);

  const handleRemoveFromDay = useCallback((dayId: string | number) => {
    setSplitData(prev => {
      const newSchedule = { ...prev.schedule };
      newSchedule[dayId] = null;
      return {
        ...prev,
        schedule: newSchedule,
      };
    });
  }, []);

  const handleAddRotationDay = useCallback((dayNumber?: number) => {
    if (isNaN(dayNumber) || dayNumber < 1) {
      console.error('Invalid dayNumber:', dayNumber);
      return;
    }
    setSplitData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayNumber]: null,
      },
    }));
  }, []);

  const handleRemoveRotationDay = useCallback((dayNumber?: number) => {
    if (isNaN(dayNumber) || dayNumber < 1) {
      console.error('Invalid dayNumber:', dayNumber);
      return;
    }

    setSplitData(prev => {
      const newSchedule = { ...prev.schedule };
      delete newSchedule[dayNumber];
      return {
        ...prev,
        schedule: newSchedule,
      };
    });
  }, []);

  const handleChange = useCallback((field: string, value: unknown) => {
    setSplitData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    if (currentStep === 0) return splitData.name.trim().length > 0;
    if (currentStep === 1) {
      const hasAssignedWorkouts = Object.values(splitData.schedule).some(w => w !== null);
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
      let splitId;
      if (isEditing) {
        await updateSplitInFirestore(String(splitData.id), splitData);
        splitId = splitData.id;
      } else {
        splitId = await addSplitToFirestore(splitData);
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
                (navigation as any).navigate('WorkoutLibrary', {
                  refresh: true,
                  newSplitId: splitId
                });
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
            // @ts-expect-error schedule step accepts flexible day ids
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