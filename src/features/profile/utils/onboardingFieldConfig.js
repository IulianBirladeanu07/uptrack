const onboardingFieldConfig = [
  {
    key: 'unitSystem',
    type: 'picker',
    optionsKey: 'UNIT_OPTIONS',
    title: 'Units',
    description: 'Which measurement system do you use?',
  },
  {
    key: 'gender',
    type: 'picker',
    optionsKey: 'GENDER_OPTIONS',
    title: 'Gender',
    description: 'This affects your BMR calculation.',
  },
  {
    key: 'age',
    type: 'stepper',
    unit: 'yrs',
    min: 16,
    max: 80,
    step: 1,
    title: 'Age',
    description: 'Enter your age in years.',
  },
  {
    key: 'height',
    type: 'unit_input',
    title: 'Height',
    description: 'Enter your height.',
    metric: { unit: 'cm', min: 120, max: 250, step: 1 },
    imperial: {
      feet:   { unit: 'ft', min: 3, max: 8,  step: 1 },
      inches: { unit: 'in', min: 0, max: 11, step: 1 },
    },
    convertToMetric: true,
  },
  {
    key: 'currentWeight',
    type: 'unit_input',
    title: 'Current Weight',
    description: 'Enter your current weight.',
    metric:   { unit: 'kg',  min: 30, max: 300, step: 0.1, decimals: 1 },
    imperial: { unit: 'lbs', min: 66, max: 660, step: 0.5, decimals: 1 },
    convertToMetric: true,
  },
  {
    key: 'targetWeight',
    type: 'unit_input',
    title: 'Target Weight',
    description: 'Enter your target weight.',
    metric:   { unit: 'kg',  min: 30, max: 300, step: 0.1, decimals: 1 },
    imperial: { unit: 'lbs', min: 66, max: 660, step: 0.5, decimals: 1 },
    convertToMetric: true,
  },
  {
    key: 'bfCategory',
    type: 'physique',
    optionsKey: 'BF_CATEGORY_OPTIONS',
    title: 'Physique',
    description: 'Which best matches how you look right now?',
    skipIf: (formData) => {
      const current = parseFloat(formData.currentWeight);
      const target  = parseFloat(formData.targetWeight);
      return !current || !target || current === target;
    },
  },
  {
    key: 'stressLevel',
    type: 'picker',
    optionsKey: 'STRESS_OPTIONS',
    title: 'Stress Level',
    description: 'How would you describe your usual stress level?',
  },
  {
    key: 'experienceLevel',
    type: 'picker',
    optionsKey: 'EXPERIENCE_OPTIONS',
    title: 'Training Experience',
    description: 'How would you describe your training experience?',
  },
  {
    key: 'activityLevel',
    type: 'picker',
    optionsKey: 'ACTIVITY_OPTIONS',
    title: 'Activity Level',
    description: 'How would you describe your usual activity level?',
  },
  {
    key: 'avgDailySteps',
    type: 'stepper',
    unit: 'steps',
    min: 0,
    max: 25000,
    step: 500,
    title: 'Daily Steps',
    description: 'Roughly how many steps do you average per day? This helps set your calorie target accurately.',
  },
];

export default onboardingFieldConfig;