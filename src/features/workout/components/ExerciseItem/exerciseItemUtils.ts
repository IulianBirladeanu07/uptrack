export const SET_OPTIONS = [1, 2, 3, 4, 5];

export const REP_RANGE_OPTIONS = [
  { label: '5-8', value: '5-8' },
  { label: '8-12', value: '8-12' },
  { label: '12-15', value: '12-15' },
];

export const REST_TIME_OPTIONS = [
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '4m', value: 240 },
  { label: '5m', value: 300 },
];

export const formatRestTime = (seconds?: number) => {
  if (!seconds) return '3m';

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = seconds / 60;

  if (seconds % 60 === 0) {
    return `${Math.floor(minutes)}m`;
  }

  if (seconds % 30 === 0) {
    return `${minutes}m`;
  }

  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = seconds % 60;

  if (wholeMinutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${wholeMinutes}m ${remainingSeconds}s`;
};

export const isCustomRepRange = (repRange?: string) =>
  Boolean(repRange && !REP_RANGE_OPTIONS.some((opt) => opt.value === repRange));

export const isCustomRestTime = (restTime?: number) =>
  Boolean(restTime && !REST_TIME_OPTIONS.some((opt) => opt.value === restTime));

export const getSetsRepsLabel = (numSets?: number | string, repRange?: string) =>
  numSets && repRange
    ? `${numSets} x ${repRange}`
    : numSets
    ? `${numSets} sets`
    : repRange
    ? `${repRange} reps`
    : '';

export const sanitizeTimeInput = (text: string) => text.replace(/[^0-9]/g, '');

export const isValidSecondsInput = (cleaned: string) => (parseInt(cleaned) || 0) <= 59;

export const getRestInputs = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return {
    minutes: m > 0 ? m.toString() : '',
    seconds: s > 0 ? s.toString() : '',
  };
};

export const getTotalRestSeconds = (minutes: string, seconds: string) => {
  const m = parseInt(minutes) || 0;
  const s = parseInt(seconds) || 0;
  return m * 60 + s;
};
