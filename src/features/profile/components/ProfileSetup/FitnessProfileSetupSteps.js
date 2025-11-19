import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';
import styles from './FitnessProfileSetupStepsStyle';

const NavigationButtons = ({
  onBack,
  onNext,
  onSave,
  isFinalStep,
  disableNext,
  disableBack,
  backLabel = 'Back',
  nextLabel = 'Next',
  saveLabel = 'Save Profile',
}) => (
  <View style={styles.buttonContainer}>
    {onBack && (
      <TouchableOpacity
        style={[styles.backButton, disableBack && styles.disabledButton]}
        onPress={disableBack ? null : onBack}
        disabled={disableBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Text style={[styles.buttonText, disableBack && styles.disabledButtonText]}>
          {backLabel}
        </Text>
      </TouchableOpacity>
    )}
    <TouchableOpacity
      style={[styles.nextButton, disableNext && styles.disabledButton]}
      onPress={isFinalStep ? onSave : onNext}
      disabled={disableNext}
      accessibilityRole="button"
      accessibilityLabel={isFinalStep ? saveLabel : nextLabel}
    >
      <Text style={styles.buttonText}>{isFinalStep ? saveLabel : nextLabel}</Text>
    </TouchableOpacity>
  </View>
);

NavigationButtons.propTypes = {
  onBack: PropTypes.func,
  onNext: PropTypes.func,
  onSave: PropTypes.func,
  isFinalStep: PropTypes.bool,
  disableNext: PropTypes.bool,
  disableBack: PropTypes.bool,
  backLabel: PropTypes.string,
  nextLabel: PropTypes.string,
  saveLabel: PropTypes.string,
};

const FitnessProfileSetupSteps = ({
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
  nextLabel,
  backLabel,
  saveLabel,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [title]);

  const handleNextPress = () => {
    if (disableNext) {
      setShowError(true);
    } else {
      setShowError(false);
      if (onNext) onNext();
    }
  };

  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      {progress && <Text style={styles.progress}>{progress}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.stepContent}>
        {children || <Text style={styles.placeholderText}>No content available.</Text>}
      </View>

      <NavigationButtons
        onBack={onBack}
        onNext={handleNextPress}
        onSave={onSave}
        isFinalStep={isFinalStep}
        disableNext={disableNext}
        disableBack={disableBack}
        nextLabel={nextLabel}
        backLabel={backLabel}
        saveLabel={saveLabel}
      />

      {showError && disableNext && (
        <Text style={styles.errorText}>
          Please complete all required fields to proceed.
        </Text>
      )}
    </Animated.View>
  );
};

FitnessProfileSetupSteps.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onNext: PropTypes.func,
  onBack: PropTypes.func,
  onSave: PropTypes.func,
  disableNext: PropTypes.bool,
  disableBack: PropTypes.bool,
  progress: PropTypes.string,
  isFinalStep: PropTypes.bool,
  nextLabel: PropTypes.string,
  backLabel: PropTypes.string,
  saveLabel: PropTypes.string,
};

export default FitnessProfileSetupSteps;