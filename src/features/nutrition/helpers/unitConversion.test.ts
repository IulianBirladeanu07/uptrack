import { convertQuantity, scalingFactor } from './unitConversion';

describe('convertQuantity', () => {
  it('converts between g and oz', () => {
    expect(convertQuantity(100, 'g', 'oz', 100, 'g')).toBe(3.53);
    expect(convertQuantity(1, 'oz', 'g', 100, 'g')).toBe(28.35);
  });

  it('converts between mL and cup', () => {
    expect(convertQuantity(236.588, 'mL', 'cup', 100, 'ml')).toBe(1);
    expect(convertQuantity(2, 'cup', 'mL', 100, 'ml')).toBe(473.18);
  });

  it('treats g and mL as the same amount', () => {
    expect(convertQuantity(250, 'g', 'mL', 100, 'g')).toBe(250);
    expect(convertQuantity(250, 'mL', 'g', 100, 'ml')).toBe(250);
  });

  it('resets to 1 when switching to serving', () => {
    expect(convertQuantity(150, 'g', 'serving', 100, 'g')).toBe(1);
    expect(convertQuantity(3.53, 'oz', 'serving', 30, 'g')).toBe(1);
  });

  it('turns servings into the base amount of the food', () => {
    expect(convertQuantity(1, 'serving', 'g', 30, 'g')).toBe(30);
    expect(convertQuantity(2, 'serving', 'g', 30, 'g')).toBe(60);
    expect(convertQuantity(1, 'serving', 'oz', 100, 'g')).toBe(3.53);
    expect(convertQuantity(1, 'serving', 'cup', 240, 'ml')).toBe(1.01);
  });

  it('keeps the number when the base amount cannot be measured', () => {
    expect(convertQuantity(2, 'serving', 'g', 1, 'serving')).toBe(2);
    expect(convertQuantity(5, 'pinch', 'g', 100, 'g')).toBe(5);
  });

  it('returns the same number for the same unit', () => {
    expect(convertQuantity(42, 'g', 'g', 100, 'g')).toBe(42);
    expect(convertQuantity(42, 'mL', 'ml', 100, 'ml')).toBe(42);
  });

  it('never returns less than 0.01', () => {
    expect(convertQuantity(0.01, 'g', 'cup', 100, 'g')).toBe(0.01);
  });
});

describe('scalingFactor', () => {
  it('is 1 for the base amount in the base unit', () => {
    expect(scalingFactor(100, 'g', 100, 'g')).toBe(1);
    expect(scalingFactor(30, 'g', 30, 'g')).toBe(1);
  });

  it('keeps nutrients stable when a quantity is converted to another unit', () => {
    const oz = convertQuantity(100, 'g', 'oz', 100, 'g');
    expect(scalingFactor(oz, 'oz', 100, 'g')).toBeCloseTo(1, 2);
  });

  it('scales by the real weight of an ounce', () => {
    expect(scalingFactor(1, 'oz', 100, 'g')).toBeCloseTo(0.283495, 6);
    expect(scalingFactor(100, 'oz', 100, 'g')).toBeCloseTo(28.3495, 6);
  });

  it('scales volumes by cups', () => {
    expect(scalingFactor(1, 'cup', 240, 'ml')).toBeCloseTo(236.588 / 240, 6);
  });

  it('treats one serving as the base amount', () => {
    expect(scalingFactor(1, 'serving', 100, 'g')).toBe(1);
    expect(scalingFactor(2.5, 'serving', 30, 'g')).toBe(2.5);
  });

  it('keeps a serving-based food in servings', () => {
    expect(scalingFactor(3, 'serving', 2, 'serving')).toBe(1.5);
  });

  it('matches units regardless of case', () => {
    expect(scalingFactor(200, 'mL', 100, 'ml')).toBe(2);
  });

  it('falls back to the plain ratio for unknown or mixed units', () => {
    expect(scalingFactor(50, 'g', 100, 'serving')).toBe(0.5);
    expect(scalingFactor(50, 'g', 100, 'pinch')).toBe(0.5);
    expect(scalingFactor(50, undefined, 100, 'g')).toBe(0.5);
  });

  it('defaults the base quantity to 100', () => {
    expect(scalingFactor(50, 'g', undefined, 'g')).toBe(0.5);
  });
});
