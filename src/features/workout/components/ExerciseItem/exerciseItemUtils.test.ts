import {
  REP_RANGE_OPTIONS,
  REST_TIME_OPTIONS,
  SET_OPTIONS,
  formatRestTime,
  getRestInputs,
  getSetsRepsLabel,
  getTotalRestSeconds,
  isCustomRepRange,
  isCustomRestTime,
  isValidSecondsInput,
  sanitizeTimeInput,
} from './exerciseItemUtils';

describe('exercise item options', () => {
  it('keeps the selectable set, rep range and rest values', () => {
    expect(SET_OPTIONS).toEqual([1, 2, 3, 4, 5]);
    expect(REP_RANGE_OPTIONS.map(option => option.value)).toEqual(['5-8', '8-12', '12-15']);
    expect(REST_TIME_OPTIONS.map(option => option.value)).toEqual([120, 180, 240, 300]);
    expect(REST_TIME_OPTIONS.map(option => option.label)).toEqual(['2m', '3m', '4m', '5m']);
  });
});

describe('formatRestTime', () => {
  it('falls back to three minutes without a value', () => {
    expect(formatRestTime(undefined)).toBe('3m');
    expect(formatRestTime(0)).toBe('3m');
  });

  it('shows values under a minute in seconds', () => {
    expect(formatRestTime(30)).toBe('30s');
    expect(formatRestTime(59)).toBe('59s');
  });

  it('shows whole minutes and half minutes', () => {
    expect(formatRestTime(60)).toBe('1m');
    expect(formatRestTime(120)).toBe('2m');
    expect(formatRestTime(90)).toBe('1.5m');
    expect(formatRestTime(150)).toBe('2.5m');
  });

  it('shows minutes and seconds for other values', () => {
    expect(formatRestTime(75)).toBe('1m 15s');
    expect(formatRestTime(61)).toBe('1m 1s');
    expect(formatRestTime(245)).toBe('4m 5s');
  });
});

describe('custom option detection', () => {
  it('treats only values outside the presets as custom rep ranges', () => {
    expect(isCustomRepRange(undefined)).toBe(false);
    expect(isCustomRepRange('')).toBe(false);
    expect(isCustomRepRange('8-12')).toBe(false);
    expect(isCustomRepRange('6-10')).toBe(true);
  });

  it('treats only values outside the presets as custom rest times', () => {
    expect(isCustomRestTime(undefined)).toBe(false);
    expect(isCustomRestTime(0)).toBe(false);
    expect(isCustomRestTime(180)).toBe(false);
    expect(isCustomRestTime(90)).toBe(true);
  });
});

describe('getSetsRepsLabel', () => {
  it('combines sets and rep range', () => {
    expect(getSetsRepsLabel(3, '8-12')).toBe('3 x 8-12');
    expect(getSetsRepsLabel('4', '5-8')).toBe('4 x 5-8');
  });

  it('shows whichever value exists', () => {
    expect(getSetsRepsLabel(3, undefined)).toBe('3 sets');
    expect(getSetsRepsLabel(undefined, '8-12')).toBe('8-12 reps');
  });

  it('returns an empty label when neither value is usable', () => {
    expect(getSetsRepsLabel(undefined, undefined)).toBe('');
    expect(getSetsRepsLabel('', '')).toBe('');
    expect(getSetsRepsLabel(0, '5-8')).toBe('5-8 reps');
  });
});

describe('custom rest time input', () => {
  it('strips non-digit characters', () => {
    expect(sanitizeTimeInput('a1b2')).toBe('12');
    expect(sanitizeTimeInput('')).toBe('');
    expect(sanitizeTimeInput('1.5')).toBe('15');
  });

  it('accepts seconds up to 59 only', () => {
    expect(isValidSecondsInput('')).toBe(true);
    expect(isValidSecondsInput('7')).toBe(true);
    expect(isValidSecondsInput('59')).toBe(true);
    expect(isValidSecondsInput('60')).toBe(false);
    expect(isValidSecondsInput('99')).toBe(false);
  });

  it('splits stored seconds into minute and second inputs', () => {
    expect(getRestInputs(180)).toEqual({ minutes: '3', seconds: '' });
    expect(getRestInputs(90)).toEqual({ minutes: '1', seconds: '30' });
    expect(getRestInputs(45)).toEqual({ minutes: '', seconds: '45' });
    expect(getRestInputs(60)).toEqual({ minutes: '1', seconds: '' });
  });

  it('adds minute and second inputs back into total seconds', () => {
    expect(getTotalRestSeconds('2', '30')).toBe(150);
    expect(getTotalRestSeconds('1', '')).toBe(60);
    expect(getTotalRestSeconds('', '45')).toBe(45);
    expect(getTotalRestSeconds('', '')).toBe(0);
    expect(getTotalRestSeconds('abc', '')).toBe(0);
  });

  it('round-trips a stored rest time', () => {
    [45, 60, 90, 180, 245].forEach(total => {
      const { minutes, seconds } = getRestInputs(total);
      expect(getTotalRestSeconds(minutes, seconds)).toBe(total);
    });
  });
});
