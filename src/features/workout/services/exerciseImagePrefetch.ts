import { Image } from 'expo-image';
import type { ExerciseGroup } from '../../../shared/types';

export const EXERCISE_IMAGE_CACHE_KEY = 'exercise_images_cache';

const imagePrefetchStatus = new Map<string, boolean>();

export const prefetchExerciseImages = async (
  exercisesArray: ExerciseGroup[] | null | undefined,
): Promise<void> => {
  if (!exercisesArray || !Array.isArray(exercisesArray)) return;

  const imageUrls: string[] = [];
  exercisesArray.forEach(group => {
    if (group.exercises && Array.isArray(group.exercises)) {
      group.exercises.forEach(exercise => {
        if (
          exercise.imageURL &&
          exercise.imageURL.startsWith('http') &&
          !imagePrefetchStatus.has(exercise.imageURL)
        ) {
          imageUrls.push(exercise.imageURL);
        }
      });
    }
  });

  const batchSize = 3;
  for (let index = 0; index < imageUrls.length; index += batchSize) {
    const batch = imageUrls.slice(index, index + batchSize);
    setTimeout(() => {
      batch.forEach(async url => {
        try {
          imagePrefetchStatus.set(url, true);
          await Image.prefetch(url);
          imagePrefetchStatus.set(url, true);
        } catch {
          imagePrefetchStatus.set(url, false);
          console.warn('Failed to prefetch image:', url);
        }
      });
    }, index * 100);
  }
};

export const clearExerciseImagePrefetchStatus = (): void => {
  imagePrefetchStatus.clear();
};

export const getPrefetchedExerciseImageCount = (): number =>
  Array.from(imagePrefetchStatus.values()).filter(Boolean).length;
