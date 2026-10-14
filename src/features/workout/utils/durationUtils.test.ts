import { durationToMinutes, durationLabel } from './durationUtils';

describe('durationToMinutes', () => {
  it('reads M:SS as minutes', () => {
    expect(durationToMinutes('47:12')).toBe(47);
    expect(durationToMinutes('0:45')).toBe(0);
  });

  it('reads H:MM:SS as hours and minutes', () => {
    expect(durationToMinutes('1:03:40')).toBe(63);
    expect(durationToMinutes('2:00:00')).toBe(120);
  });

  it('returns null for invalid input', () => {
    expect(durationToMinutes(null)).toBeNull();
    expect(durationToMinutes(45)).toBeNull();
    expect(durationToMinutes('')).toBeNull();
    expect(durationToMinutes('abc')).toBeNull();
    expect(durationToMinutes('45')).toBeNull();
    expect(durationToMinutes('1:2:3:4')).toBeNull();
  });
});

describe('durationLabel', () => {
  it('formats minutes with a floor of one', () => {
    expect(durationLabel('47:12')).toBe('47 mins');
    expect(durationLabel('1:03:40')).toBe('63 mins');
    expect(durationLabel('0:45')).toBe('1 min');
  });

  it('returns null for invalid input', () => {
    expect(durationLabel(undefined)).toBeNull();
  });
});
