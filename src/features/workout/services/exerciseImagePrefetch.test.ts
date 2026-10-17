import { Image } from 'expo-image';
import type { ExerciseGroup } from '../../../shared/types';
import {
  clearExerciseImagePrefetchStatus,
  getPrefetchedExerciseImageCount,
  prefetchExerciseImages,
} from './exerciseImagePrefetch';

jest.mock('expo-image', () => ({ Image: { prefetch: jest.fn() } }));

const catalog: ExerciseGroup[] = [{
  muscleGroup: 'Chest',
  exercises: [
    { name: 'Bench Press', muscleGroup: 'Chest', imageURL: 'https://images.example/bench.jpg' },
    { name: 'Cable Fly', muscleGroup: 'Chest', imageURL: 'file://local.jpg' },
    { name: 'Press', muscleGroup: 'Chest', imageURL: 'http://images.example/press.jpg' },
    { name: 'Push-up', muscleGroup: 'Chest', imageURL: 'https://images.example/pushup.jpg' },
    { name: 'Dip', muscleGroup: 'Chest', imageURL: 'https://images.example/dip.jpg' },
  ],
}];

describe('exercise image prefetch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(Image.prefetch).mockResolvedValue(true);
    clearExerciseImagePrefetchStatus();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('prefetches only remote images in batches of three', async () => {
    await prefetchExerciseImages(catalog);

    expect(Image.prefetch).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(0);
    expect(Image.prefetch).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(300);
    expect(Image.prefetch).toHaveBeenCalledTimes(4);
    expect(Image.prefetch).toHaveBeenCalledWith('https://images.example/dip.jpg');
  });

  it('tracks completed URLs and skips them on later prefetch requests', async () => {
    await prefetchExerciseImages([catalog[0]]);
    await jest.advanceTimersByTimeAsync(300);

    expect(getPrefetchedExerciseImageCount()).toBe(4);

    await prefetchExerciseImages([catalog[0]]);
    await jest.advanceTimersByTimeAsync(500);

    expect(Image.prefetch).toHaveBeenCalledTimes(4);
  });

  it('logs failures and skips failed URLs until image prefetch status is cleared', async () => {
    const url = 'https://images.example/failed.jpg';
    const logWarning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(Image.prefetch).mockRejectedValueOnce(new Error('network failure'));
    const group: ExerciseGroup[] = [{
      muscleGroup: 'Back',
      exercises: [{ name: 'Row', muscleGroup: 'Back', imageURL: url }],
    }];

    try {
      await prefetchExerciseImages(group);
      await jest.advanceTimersByTimeAsync(0);

      expect(logWarning).toHaveBeenCalledWith('Failed to prefetch image:', url);
      expect(getPrefetchedExerciseImageCount()).toBe(0);

      await prefetchExerciseImages(group);
      await jest.advanceTimersByTimeAsync(0);
      expect(Image.prefetch).toHaveBeenCalledTimes(1);

      clearExerciseImagePrefetchStatus();
      await prefetchExerciseImages(group);
      await jest.advanceTimersByTimeAsync(0);
      expect(Image.prefetch).toHaveBeenCalledTimes(2);
    } finally {
      logWarning.mockRestore();
    }
  });

  it('clears cached image status when explicitly reset', async () => {
    const group = [catalog[0]];
    await prefetchExerciseImages(group);
    await jest.advanceTimersByTimeAsync(300);

    clearExerciseImagePrefetchStatus();
    await prefetchExerciseImages(group);
    await jest.advanceTimersByTimeAsync(300);

    expect(Image.prefetch).toHaveBeenCalledTimes(8);
  });
});
