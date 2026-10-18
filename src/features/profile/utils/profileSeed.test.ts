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
    });
    expect(seeded.age).toBe(30);
    expect(seeded.autoAdjustEnabled).toBe(false);
    expect(seeded.gender).toBe('female');
    expect(seeded.fitnessGoals).toBe('weight_loss');
    expect(seeded.targetCalories).toBe(1900);
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
