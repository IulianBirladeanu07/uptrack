jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
  getDoc: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightService } from './weightService';

const freshUserData = (overrides = {}) => ({
  lastWeightUpdate: new Date().toISOString(),
  currentWeight: 75,
  weightIns: [],
  ...overrides,
});

describe('WeightService cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects future-dated cache entries', () => {
    expect(WeightService.isFresh(freshUserData({
      lastWeightUpdate: new Date(Date.now() + 60_000).toISOString(),
    }))).toBe(false);
  });

  it('uses a fresh in-memory user entry without reading storage or Firestore', async () => {
    const userData = freshUserData();
    await WeightService.setCachedUserData('memory-user', userData);
    jest.clearAllMocks();

    await expect(WeightService.getUserWeightData('memory-user')).resolves.toBe(userData);
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('loads and caches a fresh persistent entry', async () => {
    const userData = freshUserData();
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));

    await expect(WeightService.getUserWeightData('storage-user')).resolves.toEqual(userData);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_storage-user');
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('falls back to Firestore when persistent data is stale', async () => {
    const userData = freshUserData();
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
      ...userData,
      currentWeight: 60,
      lastWeightUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    }));
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });

    await expect(WeightService.getUserWeightData('stale-user')).resolves.toEqual(userData);
    expect(doc).toHaveBeenCalledWith({}, 'users', 'stale-user');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_stale-user', JSON.stringify(userData));
  });

  it('falls back to Firestore instead of accepting future-dated persistent data', async () => {
    const userData = freshUserData();
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
      ...userData,
      currentWeight: 60,
      lastWeightUpdate: new Date(Date.now() + 60_000).toISOString(),
    }));
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => userData,
    });

    await expect(WeightService.getUserWeightData('future-user')).resolves.toEqual(userData);
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('returns null when the Firestore user document does not exist', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

    await expect(WeightService.getUserWeightData('missing-user')).resolves.toBeNull();
  });
});

describe('WeightService date handling', () => {
  it('treats date-only strings as local dates when finding the week start', () => {
    expect(WeightService.getWeekStartDate('2026-10-15')).toEqual(new Date(2026, 9, 12));
  });
});

describe('WeightService display data', () => {
  it('selects weekly averages and counts weigh-ins for the selected local week', async () => {
    const getUserWeightData = jest.spyOn(WeightService, 'getUserWeightData').mockResolvedValue({
      currentWeight: 74,
      weightIns: [
        { weekStart: '2026-10-12', average: 74.5, days: { monday: 74.5, tuesday: 74.4 } },
        { weekStart: '2026-10-05', average: 75 },
      ],
    });

    await expect(WeightService.getWeightDisplayData('display-user', '2026-10-15')).resolves.toEqual({
      currentWeight: 74,
      weeklyAverage: 74.5,
      lastWeekAverage: 75,
      weeklyTrend: -0.5,
      weighInCount: 2,
    });

    getUserWeightData.mockRestore();
  });

  it('propagates read failures instead of returning an empty weight summary', async () => {
    const error = new Error('weight data unavailable');
    const getUserWeightData = jest.spyOn(WeightService, 'getUserWeightData').mockRejectedValue(error);

    await expect(WeightService.getWeightDisplayData('user-1')).rejects.toBe(error);

    getUserWeightData.mockRestore();
  });
});
