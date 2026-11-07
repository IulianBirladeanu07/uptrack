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

  it('does not show the permission dialog unless it is asked to', async () => {
    expect(await ensureStepsAccess({ request: false })).toBe('permission_denied');
    expect(requestPermission).not.toHaveBeenCalled();

    (getGrantedPermissions as jest.Mock).mockResolvedValueOnce([{ accessType: 'read', recordType: 'Steps' }]);
    expect(await ensureStepsAccess({ request: false })).toBe('ready');
    expect(requestPermission).not.toHaveBeenCalled();

    expect(await ensureStepsAccess({ request: true })).toBe('ready');
    expect(requestPermission).toHaveBeenCalledTimes(1);
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
    (aggregateGroupByPeriod as jest.Mock).mockResolvedValue([
      {
        startTime: '2026-10-16T00:00',
        endTime: '2026-10-17T00:00',
        result: { COUNT_TOTAL: 2 },
      },
      {
        startTime: '2026-10-17T00:00',
        endTime: '2026-10-18T00:00',
        result: { COUNT_TOTAL: 3 },
      },
    ]);
    const to = new Date('2026-10-17T12:00:00.000Z');
    const from = new Date('2026-01-01T00:00:00.000Z');

    await expect(readDailySteps(from, to)).resolves.toEqual({
      '2026-10-16': 2,
      '2026-10-17': 3,
    });
    const request = (aggregateGroupByPeriod as jest.Mock).mock.calls[0][0];
    const expectedEarliest = new Date(to);
    expectedEarliest.setDate(expectedEarliest.getDate() - MAX_LOOKBACK_DAYS);
    expectedEarliest.setHours(0, 0, 0, 0);
    expect(request.timeRangeFilter.operator).toBe('between');
    expect(request.timeRangeFilter.startTime).toBe(expectedEarliest.toISOString());
    expect(request.timeRangeFilter.endTime).toBe(to.toISOString());
    expect(request.timeRangeSlicer).toEqual({ period: 'DAYS', length: 1 });
  });

  it('uses Samsung Health instead of combining synced source totals', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: {
          COUNT_TOTAL: 16760,
          dataOrigins: [
            'com.google.android.apps.fitness',
            'com.sec.android.app.shealth',
            'com.android.healthconnect.phone.test',
          ],
        },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 9397, dataOrigins: ['com.google.android.apps.fitness'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 7606, dataOrigins: ['com.sec.android.app.shealth'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 9760, dataOrigins: ['com.android.healthconnect.phone.test'] },
      }]);

    await expect(readDailySteps(new Date('2026-11-01T00:00:00'), new Date('2026-11-01T18:00:00')))
      .resolves.toEqual({ '2026-11-01': 7606 });
    expect(aggregateGroupByPeriod).toHaveBeenNthCalledWith(2, expect.objectContaining({
      dataOriginFilter: ['com.google.android.apps.fitness'],
    }));
    expect(aggregateGroupByPeriod).toHaveBeenNthCalledWith(3, expect.objectContaining({
      dataOriginFilter: ['com.sec.android.app.shealth'],
    }));
    expect(aggregateGroupByPeriod).toHaveBeenNthCalledWith(4, expect.objectContaining({
      dataOriginFilter: ['com.android.healthconnect.phone.test'],
    }));
  });

  it('prefers Samsung Health when Google Fit reports a higher total', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([{
        startTime: '2026-11-02T00:00',
        endTime: '2026-11-03T00:00',
        result: {
          COUNT_TOTAL: 33106,
          dataOrigins: [
            'com.google.android.apps.fitness',
            'com.sec.android.app.shealth',
            'com.android.healthconnect.phone',
          ],
        },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-02T00:00',
        endTime: '2026-11-03T00:00',
        result: { COUNT_TOTAL: 33106, dataOrigins: ['com.google.android.apps.fitness'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-02T00:00',
        endTime: '2026-11-03T00:00',
        result: { COUNT_TOTAL: 17861, dataOrigins: ['com.sec.android.app.shealth'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-02T00:00',
        endTime: '2026-11-03T00:00',
        result: { COUNT_TOTAL: 17880, dataOrigins: ['com.android.healthconnect.phone'] },
      }]);

    await expect(readDailySteps(new Date('2026-11-02T00:00:00'), new Date('2026-11-02T18:00:00')))
      .resolves.toEqual({ '2026-11-02': 17861 });
  });

  it('uses the available source when neither preferred app contributes', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 12000, dataOrigins: ['com.android.healthconnect.phone'] },
      }]);

    await expect(readDailySteps(new Date('2026-11-01T00:00:00'), new Date('2026-11-01T18:00:00')))
      .resolves.toEqual({ '2026-11-01': 12000 });
    expect(aggregateGroupByPeriod).toHaveBeenCalledTimes(1);
  });

  it('uses Samsung Health when Google Fit has an empty bucket for a day', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([
        {
          startTime: '2026-11-01T00:00',
          endTime: '2026-11-02T00:00',
          result: { COUNT_TOTAL: 17000, dataOrigins: ['com.google.android.apps.fitness', 'com.sec.android.app.shealth'] },
        },
        {
          startTime: '2026-11-02T00:00',
          endTime: '2026-11-03T00:00',
          result: { COUNT_TOTAL: 8000, dataOrigins: ['com.sec.android.app.shealth'] },
        },
      ])
      .mockResolvedValueOnce([
        {
          startTime: '2026-11-01T00:00',
          endTime: '2026-11-02T00:00',
          result: { COUNT_TOTAL: 9000, dataOrigins: ['com.google.android.apps.fitness'] },
        },
        {
          startTime: '2026-11-02T00:00',
          endTime: '2026-11-03T00:00',
          result: { COUNT_TOTAL: 0, dataOrigins: [] },
        },
      ])
      .mockResolvedValueOnce([
        {
          startTime: '2026-11-01T00:00',
          endTime: '2026-11-02T00:00',
          result: { COUNT_TOTAL: 8000, dataOrigins: ['com.sec.android.app.shealth'] },
        },
        {
          startTime: '2026-11-02T00:00',
          endTime: '2026-11-03T00:00',
          result: { COUNT_TOTAL: 8000, dataOrigins: ['com.sec.android.app.shealth'] },
        },
      ]);

    await expect(readDailySteps(new Date('2026-11-01T00:00:00'), new Date('2026-11-02T18:00:00')))
      .resolves.toEqual({ '2026-11-01': 8000, '2026-11-02': 8000 });
  });

  it('uses Samsung Health when Google Fit is absent', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 17000, dataOrigins: ['com.sec.android.app.shealth', 'com.android.healthconnect.phone'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 7606, dataOrigins: ['com.sec.android.app.shealth'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 9760, dataOrigins: ['com.android.healthconnect.phone'] },
      }]);

    await expect(readDailySteps(new Date('2026-11-01T00:00:00'), new Date('2026-11-01T18:00:00')))
      .resolves.toEqual({ '2026-11-01': 7606 });
  });

  it('falls back to the highest available source when Samsung Health and Google Fit are absent', async () => {
    (aggregateGroupByPeriod as jest.Mock)
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 17000, dataOrigins: ['com.example.source-a', 'com.example.source-b'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 7000, dataOrigins: ['com.example.source-a'] },
      }])
      .mockResolvedValueOnce([{
        startTime: '2026-11-01T00:00',
        endTime: '2026-11-02T00:00',
        result: { COUNT_TOTAL: 10000, dataOrigins: ['com.example.source-b'] },
      }]);

    await expect(readDailySteps(new Date('2026-11-01T00:00:00'), new Date('2026-11-01T18:00:00')))
      .resolves.toEqual({ '2026-11-01': 10000 });
  });
});
