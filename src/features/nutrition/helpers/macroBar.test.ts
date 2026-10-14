import { getMacroBarState, getMacroEstimate } from './macroBar';

describe('getMacroBarState', () => {
  it('fills against the target when one exists', () => {
    expect(getMacroBarState(100, 200, true, 'Carbs')).toEqual({
      safeValue: 100,
      safeMaxValue: 200,
      hasTarget: true,
      displayMax: 200,
      fillPercentage: 50,
    });
  });

  it('caps the fill at 100', () => {
    expect(getMacroBarState(300, 200, true, 'Carbs').fillPercentage).toBe(100);
  });

  it('uses the estimate path when the app has no targets', () => {
    const state = getMacroBarState(100, 200, false, 'Carbs');
    expect(state.hasTarget).toBe(false);
    expect(state.displayMax).toBe(150);
    expect(state.fillPercentage).toBe(67);
  });

  it('does not treat a zero target as a target', () => {
    const state = getMacroBarState(50, 0, true, 'Protein');
    expect(state.hasTarget).toBe(false);
    expect(state.displayMax).toBe(80);
    expect(state.fillPercentage).toBe(63);
  });

  it('never shows a full bar for a zero target', () => {
    expect(getMacroBarState(500, 0, true, 'Fat').fillPercentage).toBe(71);
    expect(getMacroBarState(5000, 0, true, 'Carbs').fillPercentage).toBeLessThan(100);
    expect(getMacroBarState(5000, 0, true, 'Protein').fillPercentage).toBeLessThan(100);
  });

  it('shows an empty bar for zero consumed with a zero target', () => {
    expect(getMacroBarState(0, 0, true, 'Carbs').fillPercentage).toBe(0);
  });

  it('survives missing numbers', () => {
    expect(getMacroBarState(undefined, undefined, true, 'Fat').fillPercentage).toBe(0);
    expect(getMacroBarState(null, null, false, 'Fat').fillPercentage).toBe(0);
    expect(getMacroBarState(NaN, NaN, true, 'Fat').fillPercentage).toBe(0);
  });
});

describe('getMacroEstimate', () => {
  it('applies the per-macro floors', () => {
    expect(getMacroEstimate(10, 'carbs')).toBe(150);
    expect(getMacroEstimate(10, 'Protein')).toBe(80);
    expect(getMacroEstimate(10, 'FAT')).toBe(70);
  });

  it('scales with the value above the floor', () => {
    expect(getMacroEstimate(200, 'carbs')).toBe(300);
    expect(getMacroEstimate(100, 'fat')).toBe(140);
  });

  it('falls back for an unknown macro', () => {
    expect(getMacroEstimate(100, 'Fiber')).toBe(150);
    expect(getMacroEstimate(10, 'Fiber')).toBe(100);
  });
});
