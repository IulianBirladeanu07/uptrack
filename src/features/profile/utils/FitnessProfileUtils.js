const CONSTANTS = {
  HEIGHT_MIN: 120,
  HEIGHT_MAX: 250,
  MAX_TARGET_WEIGHT_MULTIPLIER: 1.5,
  WEEKS_PER_MONTH: 4.34524,
  STRESS_MULTIPLIERS: {
    low: 1.05,
    moderate: 1,
    high: 0.9,
  },
  AGE_ADJUSTMENT_FACTOR: 0.95,
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  },
  BULKING_RATE_RANGES: {
    male: { min: 0.75, max: 1.5 },
    female: { min: 0.5, max: 1.0 },
  },
  CUTTING_RATE_RANGES: {
    male: { min: 0.5, max: 1.0 },
    female: { min: 0.5, max: 0.9 },
  },
  BULKING_SURPLUS_PERCENTAGE: 0.1,
  CUTTING_DEFICIT_PERCENTAGE: 0.2,
  MACRO_RATIOS: {
    cutting: { protein: 0.35, carbs: 0.4, fats: 0.25 },
    bulking: { protein: 0.25, carbs: 0.5, fats: 0.25 },
    maintenance: { protein: 0.3, carbs: 0.45, fats: 0.25 },
  },
  CALORIES_PER_GRAM: {
    protein: 4,
    carbs: 4,
    fats: 9,
  },
};

const isPositiveNumber = (value) => value && !isNaN(value) && parseFloat(value) > 0;

export const validateInput = (key, value, currentWeight) => {
  const parsedValue = parseFloat(value);

  switch (key) {
    case 'currentWeight':
    case 'targetWeight':
    case 'height':
    case 'age':
      if (!isPositiveNumber(value)) return false;
      if (key === 'height') {
        return (
          parsedValue >= CONSTANTS.HEIGHT_MIN && parsedValue <= CONSTANTS.HEIGHT_MAX
        );
      }
      return true;

    default:
      return true;
  }
};

export const calculateBMR = (gender, weight, height, age) => {
  const genderConstant = gender === 'male' ? 5 : -161;
  let bmr = 10 * weight + 6.25 * height - 5 * age + genderConstant;

  if (age > 40) {
    bmr *= CONSTANTS.AGE_ADJUSTMENT_FACTOR;
  }

  return bmr;
};

export const getActivityMultiplier = (activityLevel) =>
  CONSTANTS.ACTIVITY_MULTIPLIERS[activityLevel] || 1.0;

export const calculateTDEE = (bmr, activityLevel) => {
  const activityMultiplier = getActivityMultiplier(activityLevel);
  return bmr * activityMultiplier;
};

export const calculateCaloriesForGoal = (goal, tdee) => {
  let calorieAdjustment = 0;

  if (goal === 'muscle_gain') {
    calorieAdjustment = tdee * CONSTANTS.BULKING_SURPLUS_PERCENTAGE;
  } else if (goal === 'weight_loss') {
    calorieAdjustment = tdee * -CONSTANTS.CUTTING_DEFICIT_PERCENTAGE;
  }

  return tdee + calorieAdjustment;
};

export const calculateMacros = (goal, calories, weight) => {
  const macroRatios = CONSTANTS.MACRO_RATIOS[goal] || CONSTANTS.MACRO_RATIOS.maintenance;
  const { protein, carbs, fats } = macroRatios;

  let proteinGrams;
  if (goal === 'weight_loss') {
    proteinGrams = Math.min(weight * 2.4, 0.35 * calories / CONSTANTS.CALORIES_PER_GRAM.protein);
  } else if (goal === 'muscle_gain') {
    proteinGrams = Math.min(weight * 2.2, 0.25 * calories / CONSTANTS.CALORIES_PER_GRAM.protein);
  } else {
    proteinGrams = (calories * protein) / CONSTANTS.CALORIES_PER_GRAM.protein;
  }

  const proteinCalories = proteinGrams * CONSTANTS.CALORIES_PER_GRAM.protein;

  const remainingCalories = calories - proteinCalories;
  if (remainingCalories < 0) {
    console.warn("Remaining calories are negative after protein calculation. Adjusting protein intake.");
    proteinGrams = Math.max(0, calories / CONSTANTS.CALORIES_PER_GRAM.protein);
    return calculateMacros(goal, calories, weight);
  }
  const totalMacroRatio = carbs + fats;
  const carbsCalories = (remainingCalories * carbs) / totalMacroRatio;
  const fatsCalories = (remainingCalories * fats) / totalMacroRatio;
  const macros = {
    protein: parseFloat(proteinGrams.toFixed(1)),
    carbs: parseFloat((carbsCalories / CONSTANTS.CALORIES_PER_GRAM.carbs).toFixed(1)),
    fats: parseFloat((fatsCalories / CONSTANTS.CALORIES_PER_GRAM.fats).toFixed(1)),
  };

  return macros;
};

export const calculateRate = (goal, formData) => {
  const {
    currentWeight,
    targetWeight,
    experienceLevel,
    gender,
    stressLevel,
    age,
    activityLevel,
  } = formData;

  const weight = parseFloat(currentWeight);
  const weightToLose = weight - parseFloat(targetWeight);

  let rate = 0;
  if (goal === 'muscle_gain') {
    const range = CONSTANTS.BULKING_RATE_RANGES[gender];
    let experienceFactor = 1;

    if (experienceLevel === 'beginner') experienceFactor = 1.35;
    if (experienceLevel === 'intermediate') experienceFactor = 1.15;
    if (experienceLevel === 'advanced') experienceFactor = 0.85;

    const ratePercentage =
      range.min + (range.max - range.min) * (experienceFactor - 1);
    rate = (weight * ratePercentage) / 100;
  } else if (goal === 'weight_loss') {
    const range = CONSTANTS.CUTTING_RATE_RANGES[gender];
    let experienceFactor = 1;
    let activityFactor = 1;

    if (experienceLevel === 'beginner') experienceFactor = 1.35;
    if (experienceLevel === 'intermediate') experienceFactor = 1.25;
    if (experienceLevel === 'advanced') experienceFactor = 0.75;

    if (activityLevel === 'very_active') activityFactor = 1.15;

    const ratePercentage =
      range.min + (range.max - range.min) * (experienceFactor - 1);

    rate = (weight * ratePercentage * activityFactor) / 100;

    if (weightToLose > 6 && weightToLose <= 10) rate *= 0.95;
    if (weightToLose > 10) rate *= 0.85;
  }

  rate *= CONSTANTS.STRESS_MULTIPLIERS[stressLevel] || 1;
  if (age > 30) rate *= CONSTANTS.AGE_ADJUSTMENT_FACTOR;

  return rate;
};
const generateNotes = (goal, stressLevel, experienceLevel, ratePerWeek, ratePerMonth) => {
  const notes = [];

  if (goal === 'weight_loss') {
    notes.push({
      type: 'goal',
      text: `Your goal is to lose ${ratePerWeek} kg/week or ${ratePerMonth} kg/month.`,
    });
    notes.push({
      type: 'instruction',
      text: 'The app will automatically adjust your calories and workout plan based on your progress. Focus on logging your meals and workouts consistently. The more data you provide, the more accurately the app can fine-tune your plan for optimal results.',
    });

    if (stressLevel === 'high') {
      notes.push({
        type: 'warning',
        text: "High stress levels may impact your progress. While the app will adjust your plan, make sure you're managing stress and prioritizing recovery.",
      });
    }

    if (experienceLevel === 'beginner') {
      notes.push({
        type: 'tip',
        text: "As a beginner, the app will help you avoid overly aggressive cuts and suggest a steady, sustainable pace for weight loss. Log your meals and workouts, and the app will guide you toward your goal.",
      });
    }
  } else if (goal === 'muscle_gain') {
    notes.push({
      type: 'goal',
      text: `Your goal is to gain ${ratePerMonth} kg/month.`,
    });
    notes.push({
      type: 'instruction',
      text: 'The app will automatically adjust your caloric intake and workout plan as you log your progress. Focus on logging your meals, protein intake, and workouts so the app can optimize your muscle gain plan.',
    });

    if (stressLevel === 'high') {
      notes.push({
        type: 'warning',
        text: "High stress can slow muscle growth. While the app will adjust your plan, make sure you're managing stress and prioritizing recovery to maximize your gains.",
      });
    }

    if (experienceLevel === 'beginner') {
      notes.push({
        type: 'tip',
        text: "As a beginner, the app will guide you to focus on progressive overload and ensure you're getting the proper nutrition. Track your workouts and nutrition, and let the app do the rest.",
      });
    }
  } else {
    notes.push({
      type: 'instruction',
      text: 'To maintain your current weight, simply log your meals and workouts. The app will adjust your nutrition and workout plan as needed to help you stay in maintenance mode.',
    });
  }

  return notes;
};

export const calculateWeightChangePlan = (formData) => {
  const { currentWeight, targetWeight, fitnessGoals, activityLevel, gender, height, age, experienceLevel, stressLevel } = formData;

  const currentWeightNum = parseFloat(currentWeight);
  const targetWeightNum = parseFloat(targetWeight);
  const weightDifference = Math.abs(currentWeightNum - targetWeightNum).toFixed(0);

  const deducedGoal =
    fitnessGoals ||
    (currentWeightNum > targetWeightNum
      ? 'weight_loss'
      : currentWeightNum < targetWeightNum
      ? 'muscle_gain'
      : 'maintenance');

  const bmr = calculateBMR(gender, currentWeightNum, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const adjustedCalories = calculateCaloriesForGoal(deducedGoal, tdee);

  const rawRate = calculateRate(deducedGoal, formData);
  const macros = calculateMacros(deducedGoal, adjustedCalories, currentWeightNum);

  let ratePerWeek = 0, ratePerMonth = 0;

  if (deducedGoal === 'muscle_gain') {
    ratePerMonth = rawRate;
    ratePerWeek = ratePerMonth / CONSTANTS.WEEKS_PER_MONTH;
  } else if (deducedGoal === 'weight_loss') {
    ratePerWeek = rawRate;
    ratePerMonth = ratePerWeek * CONSTANTS.WEEKS_PER_MONTH;
  }

  ratePerWeek = parseFloat(ratePerWeek.toFixed(1));
  ratePerMonth = parseFloat(ratePerMonth.toFixed(1));

  const weeksToGoal = Math.ceil(weightDifference / ratePerWeek);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeksToGoal * 7);

  const notes = generateNotes(deducedGoal, stressLevel, experienceLevel, ratePerWeek, ratePerMonth);

  const plan = {
    type: deducedGoal,
    ratePerWeek,
    ratePerMonth,
    goalCalories: Math.round(adjustedCalories),
    macros,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weeksToGoal,
    estimatedDate: estimatedDate.toLocaleDateString(),
    notes,
  };

  return plan;
};
