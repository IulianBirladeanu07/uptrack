import { Linking } from 'react-native';
import {
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { ensureStepsAccess, MAX_LOOKBACK_DAYS, openAccessHelp, readDailySteps } from './healthConnectSteps';

jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: {
    SDK_UNAVAILABLE: 0,
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 1,
    SDK_AVAILABLE: 3,
  },
  aggregateGroupByPeriod: jest.fn(),
  getGrantedPermissions: jest.fn(),
  getSdkStatus: jest.fn(),
  initialize: jest.fn(),
  openHealthConnectSettings: jest.fn(),
  requestPermission: jest.fn(),
}));

jest.mock('./stepBuckets', () => ({
  bucketsToDailySteps: jest.fn((groups) => ({ '2026-10-17': groups.length * 100 })),
}));

describe('healthConnectSteps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSdkStatus as jest.Mock).mockResolvedValue(SdkAvailabilityStatus.SDK_AVAILABLE);
    (initialize as jest.Mock).mockResolvedValue(true);
    (getGrantedPermissions as jest.Mock).mockResolvedValue([]);
    (requestPermission as jest.Mock).mockResolvedValue([{ accessType: 'read', recordType: 'Steps' }]);
  });

  it('handles unavailable, provider update, granted, requested, and denied access', async () => {
    (getSdkStatus as jest.Mock).mockResolvedValueOnce(SdkAvailabilityStatus.SDK_UNAVAILABLE);
    expect(await ensureStepsAccess()).toBe('unavailable');

    (getSdkStatus as jest.Mock).mockResolvedValueOnce(SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED);
    expect(await ensureStepsAccess()).toBe('update_required');

    (initialize as jest.Mock).mockResolvedValueOnce(false);
    expect(await ensureStepsAccess()).toBe('unavailable');

    (getGrantedPermissions as jest.Mock).mockResolvedValueOnce([{ accessType: 'read', recordType: 'Steps' }]);
    expect(await ensureStepsAccess()).toBe('ready');
    expect(requestPermission).not.toHaveBeenCalled();

    expect(await ensureStepsAccess()).toBe('ready');
    expect(requestPermission).toHaveBeenCalledWith([{ accessType: 'read', recordType: 'Steps' }]);

    (requestPermission as jest.Mock).mockResolvedValueOnce([{ accessType: 'write', recordType: 'Steps' }]);
    expect(await ensureStepsAccess()).toBe('permission_denied');
  });

  it('converts Health Connect failures to unavailable access', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    (getSdkStatus as jest.Mock).mockRejectedValue(new Error('platform error'));
    expect(await ensureStepsAccess()).toBe('unavailable');
    expect(consoleLog).toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it('opens setup help, permission settings, and ignores a failed settings URL', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    openAccessHelp('unavailable');
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('healthconnect'));
    openAccessHelp('update_required');
    expect(openURL).toHaveBeenCalledTimes(2);

    openAccessHelp('permission_denied');
    expect(openHealthConnectSettings).toHaveBeenCalled();
    openAccessHelp('ready');
    expect(openHealthConnectSettings).toHaveBeenCalledTimes(1);

    openURL.mockRejectedValueOnce(new Error('no store'));
    expect(() => openAccessHelp('unavailable')).not.toThrow();
  });

  it('clamps the requested range to the maximum lookback window', async () => {
    (aggregateGroupByPeriod as jest.Mock).mockResolvedValue([{ count: 2 }, { count: 3 }]);
    const to = new Date('2026-10-17T12:00:00.000Z');
    const from = new Date('2026-01-01T00:00:00.000Z');

    await expect(readDailySteps(from, to)).resolves.toEqual({ '2026-10-17': 200 });
    const request = (aggregateGroupByPeriod as jest.Mock).mock.calls[0][0];
    const expectedEarliest = new Date(to);
    expectedEarliest.setDate(expectedEarliest.getDate() - MAX_LOOKBACK_DAYS);
    expectedEarliest.setHours(0, 0, 0, 0);
    expect(request.timeRangeFilter.operator).toBe('between');
    expect(request.timeRangeFilter.startTime).toBe(expectedEarliest.toISOString());
    expect(request.timeRangeFilter.endTime).toBe(to.toISOString());
    expect(request.timeRangeSlicer).toEqual({ period: 'DAYS', length: 1 });
  });
});
