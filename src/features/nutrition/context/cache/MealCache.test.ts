import MealCache from './MealCache';

describe('MealCache date ranges', () => {
  it('interprets date-only range strings as local calendar dates', () => {
    const cache = new MealCache();

    expect(cache.getDateRange('2026-10-15', '2026-10-16').map(day => day.date)).toEqual([
      '2026-10-15',
      '2026-10-16',
    ]);
  });

  it('uses local dates for step ranges too', () => {
    const cache = new MealCache();
    cache.setSteps('2026-10-15', 5000);
    cache.setSteps('2026-10-16', 6000);

    expect(cache.getStepsRange('2026-10-15', '2026-10-16')).toEqual([
      { date: '2026-10-15', steps: 5000 },
      { date: '2026-10-16', steps: 6000 },
    ]);
  });
});
