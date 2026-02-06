import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from '../components/ProfileSetup/FitnessProfileSetupStepsStyle';
import stepConfig from './stepConfig';

const convertLbsToKg = (lbs) => (parseFloat(lbs) * 0.453592).toFixed(1);
const convertFtInToCm = (feet, inches) => {
  const totalInches = (parseFloat(feet) * 12) + parseFloat(inches || 0);
  return (totalInches * 2.54).toFixed(1);
};

const renderPicker = (value, onValueChange, options) => (
  <View style={styles.pickerWrapper}>
    <Picker selectedValue={value} onValueChange={onValueChange} style={styles.picker} dropdownIconColor="#FFF">
      {options.map((option) => (
        <Picker.Item key={option.value} label={option.label} value={option.value} />
      ))}
    </Picker>
  </View>
);

const renderTextInput = (value, onChangeText, placeholder) => (
  <TextInput
    style={styles.input}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#CCCCCC"
    keyboardType="numeric"
  />
);

const renderUnitInput = (step, formData, handleChange) => {
  const unitSystem = formData.unitSystem || 'metric';
  const { key } = step;

  if (unitSystem === 'metric') {
    return renderTextInput(
      formData[key], 
      (value) => handleChange(key, value), 
      step.metric.placeholder
    );
  } else if (key === 'height') {
    return (
      <View style={styles.imperialHeightContainer}>
        <View style={styles.feetInputWrapper}>
          {renderTextInput(
            formData[`${key}_feet`], 
            (value) => {
              handleChange(`${key}_feet`, value);
              if (step.convertToMetric && formData[`${key}_inches`]) {
                const cmValue = convertFtInToCm(value, formData[`${key}_inches`]);
                handleChange(key, cmValue);
              }
            }, 
            step.imperial.feet.placeholder
          )}
        </View>
        <View style={styles.inchesInputWrapper}>
          {renderTextInput(
            formData[`${key}_inches`], 
            (value) => {
              handleChange(`${key}_inches`, value);
              if (step.convertToMetric && formData[`${key}_feet`]) {
                const cmValue = convertFtInToCm(formData[`${key}_feet`], value);
                handleChange(key, cmValue);
              }
            }, 
            step.imperial.inches.placeholder
          )}
        </View>
      </View>
    );
  } else {
    return renderTextInput(
      formData[`${key}_lbs`], 
      (value) => {
        handleChange(`${key}_lbs`, value);
        if (step.convertToMetric) {
          const kgValue = convertLbsToKg(value);
          handleChange(key, kgValue);
        }
      }, 
      step.imperial.placeholder
    );
  }
};

const renderDescription = (key, value) => {
  const stepDescription = stepConfig.find((step) => step.key === key)?.details?.[value];
  return stepDescription ? (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionTitle}>Description:</Text>
      <Text style={styles.descriptionText}>
        <Text style={styles.descriptionCategory}>{stepDescription.label}: </Text>
        {stepDescription.description}
      </Text>
    </View>
  ) : null;
};

const renderContent = (step, formData, handleChange) => {
  const { type, key, options } = step;
  
  if (type === 'picker') {
    return (
      <>
        {renderPicker(formData[key], (value) => handleChange(key, value), options)}
        {step.details && formData[key] && renderDescription(key, formData[key])}
      </>
    );
  } else if (type === 'unit_input') {
    return renderUnitInput(step, formData, handleChange);
  }
  
  return renderTextInput(formData[key], (value) => handleChange(key, value), step.placeholder);
};

const steps = (formData, handleChange) => stepConfig.map((step) => {
  const { title, description, key } = step;
  return {
    title,
    description,
    key,
    content: renderContent(step, formData, handleChange),
  };
});

export default steps;