import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSplitsCache, SPLITS_CACHE_KEY } from './splitCache';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { removeItem: jest.fn() },
}));

describe('workout splits cache', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the stored splits cache using its shared key', async () => {
    await clearSplitsCache();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SPLITS_CACHE_KEY);
    expect(SPLITS_CACHE_KEY).toBe('cached_splits');
  });

  it('logs cache clearing failures without masking a completed server write', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('storage unavailable'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(clearSplitsCache()).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to clear workout splits cache:',
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
