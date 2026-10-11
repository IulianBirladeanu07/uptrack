const { userConverter, mealDayConverter } = require('./converters');

const snap = (data) => ({
  data: (options) => data,
  id: 'x',
  exists: () => true,
});

describe('userConverter', () => {
  it('round-trips plain user fields', () => {
    const user = { email: 'a@b.com', targetCalories: 2000, profileSetupComplete: true };
    expect(userConverter.toFirestore(user)).toEqual(user);
    expect(userConverter.fromFirestore(snap(user))).toEqual(user);
  });
});

describe('mealDayConverter', () => {
  it('round-trips a day document', () => {
    const day = {
      uid: 'u1',
      date: '2026-10-11',
      breakfast: [{ id: 'f1', calories: 100 }],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    expect(mealDayConverter.toFirestore(day)).toEqual(day);
    expect(mealDayConverter.fromFirestore(snap(day))).toEqual(day);
  });
});
