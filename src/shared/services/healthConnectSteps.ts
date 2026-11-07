import { Linking } from 'react-native';
import {
  SdkAvailabilityStatus,
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
} from 'react-native-health-connect';
import { bucketsToDailySteps, toDateKey, type DailySteps } from './stepBuckets';
import { formatLocalDateKey } from '../utils/localDateKey';

export type StepsAccess = 'ready' | 'unavailable' | 'update_required' | 'permission_denied';

export const MAX_LOOKBACK_DAYS = 29;

const INSTALL_URL =
  'market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding';

const STEPS_READ = { accessType: 'read', recordType: 'Steps' } as const;
const SAMSUNG_HEALTH_ORIGIN = 'com.sec.android.app.shealth';
const GOOGLE_FIT_ORIGIN = 'com.google.android.apps.fitness';

const hasStepsRead = (granted: ReadonlyArray<{ recordType: string }>): boolean =>
  granted.some(p => p.recordType === 'Steps' && 'accessType' in p && p.accessType === 'read');

export const ensureStepsAccess = async ({ request = true }: { request?: boolean } = {}): Promise<StepsAccess> => {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'unavailable';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update_required';
    if (!(await initialize())) return 'unavailable';
    if (hasStepsRead(await getGrantedPermissions())) return 'ready';
    if (!request) return 'permission_denied';
    return hasStepsRead(await requestPermission([STEPS_READ])) ? 'ready' : 'permission_denied';
  } catch (err) {
    console.log('[Steps] Health Connect access failed:', err);
    return 'unavailable';
  }
};

export const openAccessHelp = (access: StepsAccess): void => {
  if (access === 'unavailable' || access === 'update_required') {
    Linking.openURL(INSTALL_URL).catch(() => undefined);
    return;
  }
  if (access === 'permission_denied') openHealthConnectSettings();
};

export const readDailySteps = async (from: Date, to: Date): Promise<DailySteps> => {
  const earliest = new Date(to);
  earliest.setDate(earliest.getDate() - MAX_LOOKBACK_DAYS);
  earliest.setHours(0, 0, 0, 0);
  const start = from < earliest ? earliest : from;
  const groups = await aggregateGroupByPeriod({
    recordType: 'Steps',
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: to.toISOString() },
    timeRangeSlicer: { period: 'DAYS', length: 1 },
  });
  const allSourceSteps = bucketsToDailySteps(groups);
  const foundOrigins = [...new Set(groups.flatMap(({ result }) => result.dataOrigins ?? []))];
  const sourceSteps = foundOrigins.length > 1
    ? await Promise.all(foundOrigins.map(async origin => ({
      origin,
      dailySteps: bucketsToDailySteps(await aggregateGroupByPeriod({
        recordType: 'Steps',
        timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: to.toISOString() },
        timeRangeSlicer: { period: 'DAYS', length: 1 },
        dataOriginFilter: [origin],
      })),
    })))
    : [];
  const dailySteps = { ...allSourceSteps };
  if (sourceSteps.length > 1) {
    Object.keys(allSourceSteps).forEach(dateKey => {
      const sourceTotals = sourceSteps
        .map(source => ({ origin: source.origin, total: source.dailySteps[dateKey] }))
        .filter((source): source is { origin: string; total: number } => source.total !== undefined && source.total > 0);
      const samsungHealthSteps = sourceTotals.find(source => source.origin === SAMSUNG_HEALTH_ORIGIN)?.total;
      const googleFitSteps = sourceTotals.find(source => source.origin === GOOGLE_FIT_ORIGIN)?.total;
      if (samsungHealthSteps !== undefined) {
        dailySteps[dateKey] = samsungHealthSteps;
      } else if (googleFitSteps !== undefined) {
        dailySteps[dateKey] = googleFitSteps;
      } else if (sourceTotals.length) {
        dailySteps[dateKey] = Math.max(...sourceTotals.map(source => source.total));
      }
    });
  }
  if (__DEV__) {
    Object.keys(allSourceSteps).sort().forEach(k => {
      console.log('[Steps] Health Connect day', k, JSON.stringify({
        all: allSourceSteps[k],
        picked: dailySteps[k],
        sources: Object.fromEntries(sourceSteps.map(s => [s.origin, s.dailySteps[k] ?? null])),
      }));
    });
    const dateKey = formatLocalDateKey(to);
    console.log('[Steps] Health Connect aggregate', {
      requestedStart: start.toISOString(),
      requestedEnd: to.toISOString(),
      bucketCount: groups.length,
      dateKey,
      buckets: groups.filter(({ startTime }) => toDateKey(startTime) === dateKey).map(({ startTime, endTime, result }) => ({
        startTime,
        endTime,
        total: result.COUNT_TOTAL,
        dataOrigins: JSON.stringify(result.dataOrigins),
        sourceTotals: JSON.stringify(sourceSteps
          .filter(source => (result.dataOrigins ?? []).includes(source.origin))
          .map(source => ({ origin: source.origin, total: source.dailySteps[toDateKey(startTime)] ?? 0 }))),
      })),
      dateTotal: dailySteps[dateKey] ?? null,
    });
  }
  return dailySteps;
};
