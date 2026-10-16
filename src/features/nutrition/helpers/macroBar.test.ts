import { getMacroBarState } from './macroBar';

describe('getMacroBarState', () => {
  it('fills against the target when one exists', () => {
    expect(getMacroBarState(100, 200, true)).toEqual({
      safeValue: 100,
      safeMaxValue: 200,
      hasTarget: true,
      fillPercentage: 50,
    });
  });

  it('caps the fill at 100', () => {
    expect(getMacroBarState(300, 200, true).fillPercentage).toBe(100);
  });

  it('shows no progress when the app has no targets', () => {
    const state = getMacroBarState(100, 200, false);
    expect(state.hasTarget).toBe(false);
    expect(state.fillPercentage).toBe(0);
  });

  it('does not treat a zero target as a target', () => {
    const state = getMacroBarState(50, 0, true);
    expect(state.hasTarget).toBe(false);
    expect(state.fillPercentage).toBe(0);
  });

  it('never shows a full bar for a zero target', () => {
    expect(getMacroBarState(500, 0, true).fillPercentage).toBe(0);
    expect(getMacroBarState(5000, 0, true).fillPercentage).toBe(0);
  });

  it('shows an empty bar for zero consumed', () => {
    expect(getMacroBarState(0, 200, true).fillPercentage).toBe(0);
    expect(getMacroBarState(0, 0, true).fillPercentage).toBe(0);
  });

  it('survives missing numbers', () => {
    expect(getMacroBarState(undefined, undefined, true).fillPercentage).toBe(0);
    expect(getMacroBarState(null, null, false).fillPercentage).toBe(0);
    expect(getMacroBarState(NaN, NaN, true).fillPercentage).toBe(0);
  });
});
