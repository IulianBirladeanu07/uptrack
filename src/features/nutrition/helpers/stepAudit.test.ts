import { auditSteps } from './stepAudit';
import type { StepsBySource } from '../../../shared/services/healthConnectSteps';
import type { DailySteps } from '../../../shared/types';
import { formatLocalDateKey } from '../../../shared/utils/localDateKey';

const dateKey = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatLocalDateKey(date);
};

const row = (
  all: number,
  picked: number,
  samsung?: number,
  googleFit?: number,
  phone?: number,
): StepsBySource[string] => ({
  all,
  picked,
  sources: {
    ...(samsung === undefined ? {} : { 'com.sec.android.app.shealth': samsung }),
    ...(phone === undefined ? {} : { 'com.android.healthconnect.phone.device': phone }),
    ...(googleFit === undefined ? {} : { 'com.google.android.apps.fitness': googleFit }),
  },
});

describe('auditSteps', () => {
  it('flags differing values, source discrepancies, inflated aggregates, and missing stored days', () => {
    const first = dateKey(-1);
    const second = dateKey(-2);
    const result = auditSteps(
      { [first]: 9000 } as DailySteps,
      {
        [first]: row(16000, 9000, 9000, 8000),
        [second]: row(5000, 5000, 5000, 5000),
      },
    );

    expect(result.days.find(day => day.date === first)?.flags).toEqual([
      'SOURCES_DIFFER',
      'ALL_INFLATED',
    ]);
    expect(result.days.find(day => day.date === second)?.flags).toEqual(['STORED_DIFFERS', 'MISSING_STORED']);
    expect(result.summary.daysPerFlag).toEqual({
      STORED_DIFFERS: 1,
      SOURCES_DIFFER: 1,
      ALL_INFLATED: 1,
      MISSING_STORED: 1,
    });
  });

  it('excludes today and dates outside the 29-day audit window', () => {
    const today = dateKey(0);
    const outsideWindow = dateKey(-30);
    const result = auditSteps(
      { [today]: 4000, [outsideWindow]: 3000 } as DailySteps,
      {
        [today]: row(4000, 4000, 4000, 4000),
        [outsideWindow]: row(3000, 3000, 3000, 3000),
      },
    );

    expect(result.days).toEqual([]);
    expect(result.summary.daysCompared).toBe(0);
  });

  it('summarizes source ratios and the most frequent exact stored-source match', () => {
    const first = dateKey(-1);
    const second = dateKey(-2);
    const result = auditSteps(
      { [first]: 9000, [second]: 10000 } as DailySteps,
      {
        [first]: row(11000, 9000, 9000, 8000),
        [second]: row(12000, 10000, 10000, 8000),
      },
    );

    expect(result.summary.meanSamsungGoogleFitRatio).toBeCloseTo(1.1875);
    expect(result.summary.storedMatchesMostOften).toBe('samsung');
  });

  it('handles null stored data and absent source totals', () => {
    const yesterday = dateKey(-1);
    const result = auditSteps(null, {
      [yesterday]: { all: 0, picked: 0, sources: {} },
    });

    expect(result.days).toEqual([{
      date: yesterday,
      stored: null,
      all: 0,
      samsung: null,
      phone: null,
      googleFit: null,
      picked: 0,
      flags: ['STORED_DIFFERS'],
    }]);
    expect(result.summary.meanSamsungGoogleFitRatio).toBeNull();
    expect(result.summary.storedMatchesMostOften).toBe('none');
  });

  it('ignores zero sources in the discrepancy and ratio summaries and counts phone matches', () => {
    const yesterday = dateKey(-1);
    const result = auditSteps(
      { [yesterday]: 9000 } as DailySteps,
      { [yesterday]: row(12000, 9000, 0, 10000, 9000) },
    );

    expect(result.days[0].flags).toEqual(['ALL_INFLATED']);
    expect(result.summary.meanSamsungGoogleFitRatio).toBeNull();
    expect(result.summary.storedMatchesMostOften).toBe('phone');
  });
});
