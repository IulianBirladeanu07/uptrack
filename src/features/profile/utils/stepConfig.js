const stepConfig = [
  {
    title: 'Step 1: Unit Preference',
    subTitle: 'Measurement System',
    description: 'Select your preferred measurement system.',
    key: 'unitSystem',
    type: 'picker',
    options: [
      { label: 'Metric', value: 'metric' },
      { label: 'Imperial', value: 'imperial' },
    ],
  },
  {
    title: 'Step 2: Gender',
    subTitle: 'Gender Selection',
    description: 'Select your Gender (male or female).',
    key: 'gender',
    type: 'picker',
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
    ],
  },
  {
    title: 'Step 3: Age',
    subTitle: 'Age Input',
    description: 'Enter your age in years.',
    key: 'age',
    type: 'text',
    placeholder: 'Age',
  },
  {
    title: 'Step 4: Height',
    subTitle: 'Height Input',
    description: 'Enter your height.',
    key: 'height',
    type: 'unit_input',
    metric: {
      placeholder: 'Height (cm)',
    },
    imperial: {
      feet: {
        placeholder: 'Feet (ft)',
      },
      inches: {
        placeholder: 'Inches (in)',
      },
    },
    convertToMetric: true,
  },
  {
    title: 'Step 5: Current Weight',
    subTitle: 'Weight Input',
    description: 'Enter your current weight.',
    key: 'currentWeight',
    type: 'unit_input',
    metric: {
      placeholder: 'Current Weight (kg)',
    },
    imperial: {
      placeholder: 'Current Weight (lbs)',
    },
    convertToMetric: true,
  },
  {
    title: 'Step 6: Target Weight',
    subTitle: 'Target Weight Input',
    description: 'Enter your target weight.',
    key: 'targetWeight',
    type: 'unit_input',
    metric: {
      placeholder: 'Target Weight (kg)',
    },
    imperial: {
      placeholder: 'Target Weight (lbs)',
    },
    convertToMetric: true,
  },
  {
    title: 'Step 7: Usual Stress Level',
    subTitle: 'Stress Level',
    description: 'How would you describe your usual stress level?',
    key: 'stressLevel',
    type: 'picker',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'High', value: 'high' },
    ],
    details: {
      low: { label: 'Low', description: 'Relaxed, minimal stress.' },
      moderate: { label: 'Moderate', description: 'Occasional stress from work or daily life.' },
      high: { label: 'High', description: 'Constant stress or pressure affecting your daily routine.' },
    },
  },
  {
    title: 'Step 8: Activity Level',
    subTitle: 'Physical Activity',
    description: 'How would you describe your usual activity level?',
    key: 'activityLevel',
    type: 'picker',
    options: [
      { label: 'Sedentary', value: 'sedentary' },
      { label: 'Lightly Active', value: 'lightly_active' },
      { label: 'Moderately Active', value: 'moderately_active' },
      { label: 'Very Active', value: 'very_active' },
      { label: 'Extremely Active', value: 'extremely_active' },
    ],
    details: {
      sedentary: { label: 'Sedentary', description: '0-2 workouts per week. Fewer than 3k steps daily.' },
      lightly_active: { label: 'Lightly Active', description: '2-3 workouts per week. 3k-6k steps daily.' },
      moderately_active: { label: 'Moderately Active', description: '3-4 workouts per week. 6k-9k steps daily.' },
      very_active: { label: 'Very Active', description: '4-5 workouts per week. 9k-12k steps daily.' },
      extremely_active: { label: 'Extremely Active', description: '5-7 workouts per week. More than 12k steps daily.' },
    },
  },
  {
    title: 'Step 9: Training Experience',
    subTitle: 'Experience Level',
    description: 'How would you describe your training experience?',
    key: 'experienceLevel',
    type: 'picker',
    options: [
      { label: 'Novice', value: 'novice' },
      { label: 'Beginner', value: 'beginner' },
      { label: 'Intermediate', value: 'intermediate' },
      { label: 'Advanced', value: 'advanced' },
      { label: 'Elite', value: 'elite' },
    ],
    details: {
      novice: { label: 'Novice', description: 'Just starting out, or less than 6 months of consistent training.' },
      beginner: { label: 'Beginner', description: '6 months to 2 years of consistent training with progress being made.' },
      intermediate: { label: 'Intermediate', description: '2 to 5 years of structured training with consistent improvement.' },
      advanced: { label: 'Advanced', description: '5-7 years of dedicated, structured training with high-level expertise.' },
      elite: { label: 'Elite', description: '7+ years of intense training and mastery in the sport.' },
    },
  },
];

export default stepConfig;