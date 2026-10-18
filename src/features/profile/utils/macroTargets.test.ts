import {
  macroCalories,
  recalculateMacrosForCalories,
  recalculateMacrosForEdit,
} from './macroTargets';

const targets = {
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFats: 60,
};

describe('recalculateMacrosForCalories', () => {
  it('redistributes macro energy proportionally to match a calorie change', () => {
    const updated = recalculateMacrosForCalories(targets, 2200);

    expect(updated).not.toBeNull();
    expect(updated?.targetCalories).toBe(2200);
    expect(updated?.targetProtein).not.toBe(targets.targetProtein);
    expect(updated?.targetCarbs).not.toBe(targets.targetCarbs);
    expect(updated?.targetFats).not.toBe(targets.targetFats);
    expect(Math.abs(macroCalories(updated!) - 2200)).toBeLessThanOrEqual(4);
  });

  it('rejects invalid calorie amounts and unusable source macros', () => {
    expect(recalculateMacrosForCalories(targets, 0)).toBeNull();
    expect(recalculateMacrosForCalories(targets, 2000.5)).toBeNull();
    expect(recalculateMacrosForCalories({
      ...targets,
      targetProtein: 0,
      targetCarbs: 0,
      targetFats: 0,
    }, 2200)).toBeNull();
  });
});

describe('recalculateMacrosForEdit', () => {
  it('keeps the calorie target and redistributes the other macros', () => {
    const updated = recalculateMacrosForEdit(targets, 'targetProtein', 155);

    expect(updated).not.toBeNull();
    expect(updated?.targetCalories).toBe(targets.targetCalories);
    expect(updated?.targetProtein).toBe(155);
    expect(updated?.targetCarbs).not.toBe(targets.targetCarbs);
    expect(updated?.targetFats).not.toBe(targets.targetFats);
    expect(Math.abs(macroCalories(updated!) - targets.targetCalories)).toBeLessThanOrEqual(4);
  });

  it('rejects a macro value that exceeds the calorie budget', () => {
    expect(recalculateMacrosForEdit(targets, 'targetProtein', 600)).toBeNull();
  });
});
