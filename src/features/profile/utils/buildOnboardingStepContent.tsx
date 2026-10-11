import { View } from 'react-native';
import { OptionRow, NumberStepper } from '../../../shared/components/FormControls/FormControls';
import * as ProfileOptions from './profileOptions';
import onboardingFieldConfig from './onboardingFieldConfig';
import type { HeightField, Numeric, OnboardingChange, OnboardingField, OnboardingFormData, PickerField, StepperField, WeightField } from '../../../shared/types';

const convertLbsToKg = (lbs: Numeric) => parseFloat((parseFloat(String(lbs)) * 0.453592).toFixed(1));
const convertFtInToCm = (feet: Numeric, inches: Numeric) => {
  const totalInches = (parseFloat(String(feet)) * 12) + parseFloat(String(inches || 0));
  return parseFloat((totalInches * 2.54).toFixed(1));
};
const convertKgToLbs = (kg: Numeric) => parseFloat((parseFloat(String(kg)) / 0.453592).toFixed(1));
const convertCmToFtIn = (cm: Numeric) => {
  const totalInches = parseFloat(String(cm)) / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const renderPicker = (field: PickerField, formData: OnboardingFormData, handleChange: OnboardingChange) => {
  const options = ProfileOptions[field.optionsKey];
  return (
    <View>
      {options.map(opt => (
        <OptionRow
          key={opt.value}
          option={opt}
          selected={formData[field.key] === opt.value}
          onPress={(v: string) => handleChange(field.key, v)}
        />
      ))}
    </View>
  );
};

const renderStepper = (field: StepperField, formData: OnboardingFormData, handleChange: OnboardingChange) => {
  const value = formData[field.key] ?? field.min;
  const decimals = field.decimals || 0;
  return (
    <NumberStepper
      label={field.title}
      value={decimals ? value.toFixed(decimals) : value}
      unit={field.unit}
      onDecrement={() => handleChange(field.key, clamp(parseFloat((value - field.step).toFixed(decimals)), field.min, field.max))}
      onIncrement={() => handleChange(field.key, clamp(parseFloat((value + field.step).toFixed(decimals)), field.min, field.max))}
    />
  );
};

const renderUnitInput = (field: HeightField | WeightField, formData: OnboardingFormData, handleChange: OnboardingChange) => {
  const unitSystem = formData.unitSystem || 'metric';

  if (unitSystem === 'metric') {
    const cfg = field.metric;
    const value = formData[field.key] ?? cfg.min;
    const decimals = cfg.decimals || 0;
    return (
      <NumberStepper
        label={field.title}
        value={decimals ? value.toFixed(decimals) : value}
        unit={cfg.unit}
        onDecrement={() => handleChange(field.key, clamp(parseFloat((value - cfg.step).toFixed(decimals)), cfg.min, cfg.max))}
        onIncrement={() => handleChange(field.key, clamp(parseFloat((value + cfg.step).toFixed(decimals)), cfg.min, cfg.max))}
      />
    );
  }

  if (field.key === 'height') {
    const feetCfg   = field.imperial.feet;
    const inchesCfg = field.imperial.inches;
    const derivedHeight = formData.height != null ? convertCmToFtIn(formData.height) : { feet: 5, inches: 6 };
    const feet   = formData.height_feet   ?? derivedHeight.feet;
    const inches = formData.height_inches ?? derivedHeight.inches;

    const updateHeight = (nextFeet: number, nextInches: number) => {
      handleChange('height_feet', nextFeet);
      handleChange('height_inches', nextInches);
      if (field.convertToMetric) handleChange(field.key, convertFtInToCm(nextFeet, nextInches));
    };

    return (
      <View style={{ gap: 8 }}>
        <NumberStepper
          label="Feet"
          value={feet}
          unit={feetCfg.unit}
          onDecrement={() => updateHeight(clamp(feet - feetCfg.step, feetCfg.min, feetCfg.max), inches)}
          onIncrement={() => updateHeight(clamp(feet + feetCfg.step, feetCfg.min, feetCfg.max), inches)}
        />
        <NumberStepper
          label="Inches"
          value={inches}
          unit={inchesCfg.unit}
          onDecrement={() => updateHeight(feet, clamp(inches - inchesCfg.step, inchesCfg.min, inchesCfg.max))}
          onIncrement={() => updateHeight(feet, clamp(inches + inchesCfg.step, inchesCfg.min, inchesCfg.max))}
        />
      </View>
    );
  }

  const cfg = field.imperial;
  const kg = formData[field.key];
  const derivedLbs = kg != null ? convertKgToLbs(kg) : 165;
  const lbsKey = `${field.key}_lbs` as const;
  const lbs = formData[lbsKey] ?? derivedLbs;
  const updateWeight = (nextLbs: number) => {
    handleChange(lbsKey, nextLbs);
    if (field.convertToMetric) handleChange(field.key, convertLbsToKg(nextLbs));
  };

  return (
    <NumberStepper
      label={field.title}
      value={lbs.toFixed(cfg.decimals || 0)}
      unit={cfg.unit}
      onDecrement={() => updateWeight(clamp(parseFloat((lbs - cfg.step).toFixed(cfg.decimals)), cfg.min, cfg.max))}
      onIncrement={() => updateWeight(clamp(parseFloat((lbs + cfg.step).toFixed(cfg.decimals)), cfg.min, cfg.max))}
    />
  );
};

const renderField = (field: OnboardingField, formData: OnboardingFormData, handleChange: OnboardingChange) => {
  if (field.type === 'picker')     return renderPicker(field, formData, handleChange);
  if (field.type === 'stepper')    return renderStepper(field, formData, handleChange);
  if (field.type === 'unit_input') return renderUnitInput(field, formData, handleChange);
  return null;
};

const buildOnboardingStepContent = (formData: OnboardingFormData, handleChange: OnboardingChange) =>
  onboardingFieldConfig
    .filter(field => !(field.skipIf && field.skipIf(formData)))
    .map(field => ({
      key: field.key,
      type: field.type,
      title: field.title,
      description: field.description,
      content: renderField(field, formData, handleChange),
    }));

export default buildOnboardingStepContent;
