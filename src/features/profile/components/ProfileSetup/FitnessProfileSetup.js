import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { 
  View, 
  ActivityIndicator, 
  Alert, 
  Animated, 
  Easing, 
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { AuthContext } from '../../../auth/context/AuthContext';
import { auth } from '../../../auth/services/firebaseConfigService.js'
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import FitnessProfileSetupSteps from './FitnessProfileSetupSteps.js';
import styles from './FitnessProfileSetupStyle.js';
import steps from '../../utils/generateStepContent.js'
import { validateInput } from '../../../profile/utils/FitnessProfileUtils.js'

const FitnessProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    currentWeight: '',
    targetWeight: '',
    activityLevel: 'sedentary',
    experienceLevel: 'beginner',
    gender: 'male',
    age: '',
    height: '',
    stressLevel: 'low',
  });

  const { setProfileSetupComplete, refreshUserData } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [animatedProgress] = useState(new Animated.Value(0)); // Animates progress bar

  
  const firestore = getFirestore();

  // Helper to animate the progress bar
  const animateProgress = useCallback((toValue) => {
    Animated.timing(animatedProgress, {
      toValue,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.ease,
    }).start();
  }, [animatedProgress]);

  // Generate steps dynamically
  const stepsArray = useMemo(() => {
    return steps(formData, (key, value) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    });
  }, [formData]);

  // Calculate current step's progress percentage
  const progressPercentage = useMemo(() => {
    return (step / stepsArray.length) * 100;
  }, [step, stepsArray.length]);

  // Update progress bar whenever the step changes
  useEffect(() => {
    if (stepsArray.length > 0) {
      animateProgress(progressPercentage);
    }
  }, [step, stepsArray.length, animateProgress, progressPercentage]);

  // Handle step transitions
  const handleStepChange = useCallback((direction) => {
    const newStep = direction === 'next' ? step + 1 : step - 1;

    if (newStep < 1 || newStep > stepsArray.length) {
      console.warn(`Invalid step change: ${newStep}`);
      return;
    }

    setStep(newStep);
  }, [step, stepsArray.length]);

  // Save profile data to Firebase and complete setup
  const handleSaveProfile = async () => {
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'No user is logged in.');
      setLoading(false);
      return;
    }

    const userData = {
      ...formData,
      currentWeight: parseFloat(formData.currentWeight),
      targetWeight: parseFloat(formData.targetWeight),
      age: parseInt(formData.age, 10),
      height: parseFloat(formData.height),
      profileSetupComplete: true,
    };

    try {
      await setDoc(doc(firestore, 'users', user.uid), userData, { merge: true });
      await refreshUserData();
      
      // Complete the profile setup directly
      setProfileSetupComplete(true);
      
      // Reset form data and steps
      setFormData({
        currentWeight: '',
        targetWeight: '',
        activityLevel: 'sedentary',
        experienceLevel: 'beginner',
        gender: 'male',
        age: '',
        height: '',
        stressLevel: 'low',
      });
      setStep(1); // Reset to the first step
      animatedProgress.setValue(0);
      
    } catch (error) {
      console.error('Error', 'Failed to save profile: ' + error.message);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Validation for the next button
  const isStepValid = useMemo(() => {
    const currentKey = stepsArray[step - 1]?.key;
    return validateInput(currentKey, formData[currentKey]);
  }, [step, formData, stepsArray]);

  return (
    <KeyboardAvoidingView
      style={styles.scrollContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFA726" />
          ) : (
            <>
              {/* Animated progress bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['#FFA726', '#28A745'], // Gradient effect
                      }),
                    },
                  ]}
                />
              </View>

              {/* Current step */}
              <FitnessProfileSetupSteps
                title={stepsArray[step - 1]?.title}
                description={stepsArray[step - 1]?.description}
                progress={`Step ${step} of ${stepsArray.length}`}
                onNext={() => handleStepChange('next')}
                onBack={() => handleStepChange('back')}
                isFinalStep={step === stepsArray.length}
                onSave={handleSaveProfile}
                disableNext={!isStepValid}
                disableBack={step === 1}
              >
                {stepsArray[step - 1]?.content}
              </FitnessProfileSetupSteps>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default FitnessProfileSetup;