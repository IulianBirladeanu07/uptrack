import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { View, ActivityIndicator, Animated, Easing, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import buildOnboardingStepContent from '../utils/buildOnboardingStepContent';
import { validateInput } from '../utils/nutritionPlanEngine';
import OnboardingStepScreen from './OnboardingStepScreen';
import { colors, spacing } from '../../../shared/theme';
import { createStyles } from '../../../shared/theme/createStyles';

const INITIAL_FORM_DATA = {
  unitSystem:      'metric',
  gender:          'male',
  age:             25,
  height:          175,
  currentWeight:   80,
  targetWeight:    80,
  stressLevel:     'moderate',
  experienceLevel: 'intermediate',
  activityLevel:   'moderately_active',
  avgDailySteps:   0,
};

const OnboardingFlow = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [animatedProgress] = useState(new Animated.Value(0));

  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const stepsArray = useMemo(() => buildOnboardingStepContent(formData, handleChange), [formData, handleChange]);
  const safeStep = Math.min(Math.max(step, 1), stepsArray.length || 1);
  const currentField = stepsArray[safeStep - 1];

  const progressPercentage = useMemo(() =>
    stepsArray.length ? (safeStep / stepsArray.length) * 100 : 0,
  [safeStep, stepsArray.length]);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.ease,
    }).start();
  }, [progressPercentage, animatedProgress]);

  const handleStepChange = useCallback((direction) => {
    const newStep = direction === 'next' ? safeStep + 1 : safeStep - 1;
    if (newStep < 1 || newStep > stepsArray.length) return;
    setStep(newStep);
  }, [safeStep, stepsArray.length]);

  const isStepValid = useMemo(() => {
    if (!currentField) return false;
    return validateInput(currentField.key, formData[currentField.key], currentField.type);
  }, [currentField, formData]);

  const handleReviewPlan = () => {
    if (!isStepValid) return;
    navigation.navigate('PlanSummary', { formData });
  };

  if (!stepsArray.length) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: animatedProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <OnboardingStepScreen
            title={currentField?.title}
            description={currentField?.description}
            progress={`Step ${safeStep} of ${stepsArray.length}`}
            onNext={() => handleStepChange('next')}
            onBack={() => handleStepChange('back')}
            isFinalStep={safeStep === stepsArray.length}
            onSave={handleReviewPlan}
            disableNext={!isStepValid}
            disableBack={safeStep === 1}
          >
            {currentField?.content}
          </OnboardingStepScreen>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = createStyles(() => ({
  flex:                 { flex: 1, backgroundColor: colors.background.primary },
  loadingRoot:          { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  progressBarContainer: { height: 4, backgroundColor: colors.background.tertiary, marginHorizontal: spacing[5], borderRadius: 2, overflow: 'hidden', marginTop: spacing[3] },
  progressBar:          { height: '100%', backgroundColor: colors.accent.primary, borderRadius: 2 },
}));

export default OnboardingFlow;