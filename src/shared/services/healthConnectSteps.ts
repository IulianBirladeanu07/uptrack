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
import { bucketsToDailySteps, type DailySteps } from './stepBuckets';

export type StepsAccess = 'ready' | 'unavailable' | 'update_required' | 'permission_denied';

export const MAX_LOOKBACK_DAYS = 29;

const INSTALL_URL =
  'market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding';

const STEPS_READ = { accessType: 'read', recordType: 'Steps' } as const;

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
  return bucketsToDailySteps(groups);
};
