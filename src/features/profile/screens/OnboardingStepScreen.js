import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../shared/theme';
import { createStyles } from '../../../shared/theme/createStyles';

const OnboardingStepScreen = ({
  title,
  description,
  children,
  onNext,
  onBack,
  isFinalStep,
  onSave,
  disableNext,
  disableBack,
  progress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [title]);

  return (
    <View style={styles.root}>
      {progress && <Text style={styles.progress}>{progress}</Text>}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <ScrollView style={styles.fieldScroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>

      <View style={styles.buttonRow}>
        {onBack && (
          <TouchableOpacity
            style={[styles.backBtn, disableBack && styles.btnDisabled]}
            onPress={disableBack ? undefined : onBack}
            disabled={disableBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, disableNext && styles.btnDisabled]}
          onPress={isFinalStep ? onSave : onNext}
          disabled={disableNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{isFinalStep ? 'Review Plan' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  root:        { flex: 1, paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  progress:    { fontSize: fontSize[12], fontWeight: fontWeight.bold, color: colors.accent.primary, textAlign: 'center', marginBottom: spacing[3], letterSpacing: 0.5 },
  content:     { flex: 1 },
  title:       { fontSize: fontSize[24], fontWeight: fontWeight.extrabold, color: colors.text.primary, marginBottom: spacing[2] },
  description: { fontSize: fontSize[14], fontWeight: fontWeight.medium, color: colors.text.tertiary, marginBottom: spacing[5] },
  fieldScroll: { flex: 1 },
  buttonRow:   { flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[4] },
  backBtn:     { flex: 1, backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius[3], paddingVertical: spacing[4], alignItems: 'center' },
  backBtnText: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
  nextBtn:     { flex: 2, backgroundColor: colors.accent.primary, borderRadius: radius[3], paddingVertical: spacing[4], alignItems: 'center' },
  nextBtnText: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.accent.buttonText },
  btnDisabled: { opacity: 0.4 },
}));

export default OnboardingStepScreen;