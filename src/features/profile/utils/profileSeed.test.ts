const {
  seedProfileForm,
  seedProfileIdentity,
  seedProfilePicture,
} = require('./profileSeed');

describe('seedProfileForm', () => {
  it('uses defaults when userData is missing', () => {
    expect(seedProfileForm(null)).toEqual({
      age: 24,
      height: 175,
      gender: 'male',
      currentWeight: 80,
      targetWeight: 80,
      activityLevel: 'moderately_active',
      experienceLevel: 'intermediate',
      stressLevel: 'moderate',
      autoAdjustEnabled: true,
      fitnessGoals: 'maintenance',
      targetRatePerWeek: 0.3,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFats: 60,
    });
  });

  it('prefers userData values', () => {
    const seeded = seedProfileForm({
      age: 30,
      height: 180,
      gender: 'female',
      currentWeight: 70,
      targetWeight: 65,
      activityLevel: 'sedentary',
      experienceLevel: 'beginner',
      stressLevel: 'high',
      autoAdjustEnabled: false,
      fitnessGoals: 'weight_loss',
      targetCalories: 1900,
      targetProtein: 140,
      targetCarbs: 210,
      targetFats: 55,
      weightChangePlan: {
        type: 'weight_loss',
        ratePerWeek: 0.4,
        ratePerMonth: 1.7,
        targetRatePerWeek: 0.55,
        goalCalories: 1800,
        macros: { protein: 140, carbs: 210, fats: 55 },
        bmr: 1500,
        tdee: 2200,
        weeksToGoal: 10,
        estimatedDate: '',
        isEstimate: true,
      },
    });
    expect(seeded.age).toBe(30);
    expect(seeded.autoAdjustEnabled).toBe(false);
    expect(seeded.gender).toBe('female');
    expect(seeded.fitnessGoals).toBe('weight_loss');
    expect(seeded.targetCalories).toBe(1900);
    expect(seeded.targetRatePerWeek).toBe(0.55);
  });
});

describe('seedProfileIdentity', () => {
  it('falls back to auth email', () => {
    expect(seedProfileIdentity({}, 'a@b.com')).toEqual({
      username: '',
      email: 'a@b.com',
    });
  });

  it('prefers userData email', () => {
    expect(seedProfileIdentity({ username: 'u', email: 'u@x.com' }, 'a@b.com')).toEqual({
      username: 'u',
      email: 'u@x.com',
    });
  });
});

describe('seedProfilePicture', () => {
  it('returns null when missing', () => {
    expect(seedProfilePicture(undefined)).toBeNull();
  });

  it('returns the picture url', () => {
    expect(seedProfilePicture({ profilePicture: 'https://x' })).toBe('https://x');
  });
});
