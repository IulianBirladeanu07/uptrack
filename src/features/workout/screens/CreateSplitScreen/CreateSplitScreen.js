import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BasicInfoStep from './steps/BasicInfoStep';
import ScheduleStep from './steps/ScheduleStep';
import ReviewStep from './steps/ReviewStep';

import { ProgressSteps } from '../CreateWorkoutScreen/components/ProgressSteps';
import { NavigationButtons } from '../CreateWorkoutScreen/components/NavigationButtons';
import { Header } from '../CreateWorkoutScreen/components/Header';

import { fetchTemplatesFromFirestore, addSplitToFirestore, updateSplitInFirestore } from '../../../workout/handlers/WorkoutHandler';
import { STEPS } from './constants/CreateSplitScreenConstants';
import styles, { COLORS } from './CreateSplitScreenStyles';
import { SPLIT_STEPS } from '../../utils/createWorkoutUtils';

const CreateSplitScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const split = route?.params?.split;
  const isEditing = !!split;

  const [currentStep, setCurrentStep] = useState(0);
  const [splitData, setSplitData] = useState(
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
  
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(
    isEditing 
      ? (split.type === 'rotation' ? 1 : 'monday')
      : 'monday'
  );
  
  console.log(isEditing ? "Editing split:" : "Creating new split:", splitData);

  useEffect(() => {
    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const templates = await fetchTemplatesFromFirestore();
        const normalizedWorkouts = templates.map((template, index) => {
          const templateData = template.data || template;
          return {
            id: templateData.id || `workout_${Date.now()}_${index}`,
            templateName: templateData.templateName || `Workout ${index + 1}`,
            duration: templateData.duration || 0,
            exercises: Array.isArray(templateData.exercises) ? templateData.exercises : [],
            colorIndex: index,
          };
        });
        console.log('Loaded workouts:', normalizedWorkouts.length);
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

  const handleDayAssignment = useCallback((workout, dayId) => {
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

  const handleRemoveFromDay = useCallback((dayId) => {
    setSplitData(prev => {
      const newSchedule = { ...prev.schedule };
      delete newSchedule[dayId];
      return {
        ...prev,
        schedule: newSchedule,
      };
    });
  }, []);

  const handleAddRotationDay = useCallback((dayNumber) => {
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

  const handleRemoveRotationDay = useCallback((dayNumber) => {
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

  const handleChange = useCallback((field, value) => {
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
      await updateSplitInFirestore(splitData.id, splitData);
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
              navigation.navigate('WorkoutLibrary', { 
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
      error.message || `Failed to ${isEditing ? 'update' : 'create'} split. Please try again.`,
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
      <ProgressSteps currentStep={currentStep} steps={SPLIT_STEPS} />
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingIndicator} />}
      
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