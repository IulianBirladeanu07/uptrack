import type { DailySteps } from '../../../shared/types';
import type { StepsBySource } from '../../../shared/services/healthConnectSteps';
import { formatLocalDateKey } from '../../../shared/utils/localDateKey';
import { MIN_VALID_STEPS } from './stepStats';

export type StepAuditFlag =
  | 'STORED_DIFFERS'
  | 'SOURCES_DIFFER'
  | 'ALL_INFLATED'
  | 'MISSING_STORED';

export type StepAuditDay = {
  date: string;
  stored: number | null;
  all: number | null;
  samsung: number | null;
  phone: number | null;
  googleFit: number | null;
  picked: number | null;
  flags: StepAuditFlag[];
};

export type StepAuditSummary = {
  daysCompared: number;
  daysPerFlag: Record<StepAuditFlag, number>;
  meanSamsungGoogleFitRatio: number | null;
  storedMatchesMostOften: 'samsung' | 'phone' | 'googleFit' | 'all' | 'none';
};

export type StepAudit = {
  days: StepAuditDay[];
  summary: StepAuditSummary;
};

const SAMSUNG_HEALTH_ORIGIN = 'com.sec.android.app.shealth';
const HEALTH_CONNECT_PHONE_ORIGIN_PREFIX = 'com.android.healthconnect.phone';
const GOOGLE_FIT_ORIGIN = 'com.google.android.apps.fitness';
const LOOKBACK_DAYS = 29;

export const auditSteps = (
  stored: DailySteps | null | undefined,
  rows: StepsBySource,
): StepAudit => {
  const today = new Date();
  const todayKey = formatLocalDateKey(today);
  const oldest = new Date(today);
  oldest.setDate(oldest.getDate() - LOOKBACK_DAYS);
  const oldestKey = formatLocalDateKey(oldest);
  const dateKeys = [...new Set([...Object.keys(stored ?? {}), ...Object.keys(rows)])]
    .filter(date => date >= oldestKey && date < todayKey)
    .sort();
  const daysPerFlag: Record<StepAuditFlag, number> = {
    STORED_DIFFERS: 0,
    SOURCES_DIFFER: 0,
    ALL_INFLATED: 0,
    MISSING_STORED: 0,
  };
  const ratios: number[] = [];
  const storedMatches: Record<'samsung' | 'phone' | 'googleFit' | 'all', number> = {
    samsung: 0,
    phone: 0,
    googleFit: 0,
    all: 0,
  };

  const days = dateKeys.map(date => {
    const row = rows[date];
    const storedValue = stored?.[date] ?? null;
    const all = row?.all ?? null;
    const picked = row?.picked ?? null;
    const samsung = row?.sources[SAMSUNG_HEALTH_ORIGIN] ?? null;
    const phone = Object.entries(row?.sources ?? {})
      .filter(([origin, total]) => origin.startsWith(HEALTH_CONNECT_PHONE_ORIGIN_PREFIX) && total > 0)
      .reduce<number | null>((max, [, total]) => Math.max(max ?? 0, total), null);
    const googleFit = row?.sources[GOOGLE_FIT_ORIGIN] ?? null;
    const flags: StepAuditFlag[] = [];

    if (storedValue !== picked) flags.push('STORED_DIFFERS');
    if (samsung != null && samsung > 0 && googleFit != null && googleFit > 0) {
      if (googleFit > 0) ratios.push(samsung / googleFit);
      const maxSource = Math.max(samsung, googleFit);
      if (maxSource > 0 && Math.abs(samsung - googleFit) / maxSource > 0.05) {
        flags.push('SOURCES_DIFFER');
      }
    }
    if (all != null && picked != null && all > 1.3 * picked) {
      flags.push('ALL_INFLATED');
    }
    if (storedValue == null && picked != null && picked >= MIN_VALID_STEPS) {
      flags.push('MISSING_STORED');
    }
    flags.forEach(flag => { daysPerFlag[flag] += 1; });

    if (storedValue != null) {
      if (samsung === storedValue) storedMatches.samsung += 1;
      if (phone === storedValue) storedMatches.phone += 1;
      if (googleFit === storedValue) storedMatches.googleFit += 1;
      if (all === storedValue) storedMatches.all += 1;
    }

    return { date, stored: storedValue, all, samsung, phone, googleFit, picked, flags };
  });

  const highestMatchCount = Math.max(...Object.values(storedMatches));
  const storedMatchesMostOften = highestMatchCount === 0
    ? 'none'
    : storedMatches.samsung === highestMatchCount ? 'samsung'
      : storedMatches.phone === highestMatchCount ? 'phone'
        : storedMatches.googleFit === highestMatchCount ? 'googleFit' : 'all';

  return {
    days,
    summary: {
      daysCompared: days.length,
      daysPerFlag,
      meanSamsungGoogleFitRatio: ratios.length
        ? ratios.reduce((total, ratio) => total + ratio, 0) / ratios.length
        : null,
      storedMatchesMostOften,
    },
  };
};
