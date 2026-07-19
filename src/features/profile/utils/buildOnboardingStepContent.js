import { View } from 'react-native';
import { OptionRow, NumberStepper } from '../../../shared/components/FormControls/FormControls';
import * as ProfileOptions from './profileOptions';
import onboardingFieldConfig from './onboardingFieldConfig';

const convertLbsToKg = (lbs) => parseFloat((parseFloat(lbs) * 0.453592).toFixed(1));
const convertFtInToCm = (feet, inches) => {
  const totalInches = (parseFloat(feet) * 12) + parseFloat(inches || 0);
  return parseFloat((totalInches * 2.54).toFixed(1));
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const renderPicker = (field, formData, handleChange) => {
  const options = ProfileOptions[field.optionsKey];
  return (
    <View>
      {options.map(opt => (
        <OptionRow
          key={opt.value}
          option={opt}
          selected={formData[field.key] === opt.value}
          onPress={(v) => handleChange(field.key, v)}
        />
      ))}
    </View>
  );
};

const renderStepper = (field, formData, handleChange) => {
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

const renderUnitInput = (field, formData, handleChange) => {
  const unitSystem = formData.unitSystem || 'metric';
  const { key } = field;

  if (unitSystem === 'metric') {
    const cfg = field.metric;
    const value = formData[key] ?? cfg.min;
    const decimals = cfg.decimals || 0;
    return (
      <NumberStepper
        label={field.title}
        value={decimals ? value.toFixed(decimals) : value}
        unit={cfg.unit}
        onDecrement={() => handleChange(key, clamp(parseFloat((value - cfg.step).toFixed(decimals)), cfg.min, cfg.max))}
        onIncrement={() => handleChange(key, clamp(parseFloat((value + cfg.step).toFixed(decimals)), cfg.min, cfg.max))}
      />
    );
  }

  if (key === 'height') {
    const feetCfg   = field.imperial.feet;
    const inchesCfg = field.imperial.inches;
    const feet   = formData[`${key}_feet`]   ?? 5;
    const inches = formData[`${key}_inches`] ?? 6;

    const updateHeight = (nextFeet, nextInches) => {
      handleChange(`${key}_feet`, nextFeet);
      handleChange(`${key}_inches`, nextInches);
      if (field.convertToMetric) handleChange(key, convertFtInToCm(nextFeet, nextInches));
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
  const lbs = formData[`${key}_lbs`] ?? 165;
  const updateWeight = (nextLbs) => {
    handleChange(`${key}_lbs`, nextLbs);
    if (field.convertToMetric) handleChange(key, convertLbsToKg(nextLbs));
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

const renderField = (field, formData, handleChange) => {
  if (field.type === 'picker')     return renderPicker(field, formData, handleChange);
  if (field.type === 'stepper')    return renderStepper(field, formData, handleChange);
  if (field.type === 'unit_input') return renderUnitInput(field, formData, handleChange);
  return null;
};

const buildOnboardingStepContent = (formData, handleChange) =>
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