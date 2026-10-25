import { useQuery } from '@tanstack/react-query';
import { loadSplitsFromFirestore } from '../services/workoutSplitService';
import { workoutSplitQueryKey } from '../services/workoutQueryKeys';

const WORKOUT_SPLITS_STALE_TIME = 5 * 60 * 1000;

export const useWorkoutSplits = (
  uid: string | null | undefined,
  enabled = true,
) => useQuery({
  queryKey: workoutSplitQueryKey(uid ?? ''),
  queryFn: () => {
    if (!uid) throw new Error('User not authenticated.');
    return loadSplitsFromFirestore(uid);
  },
  staleTime: WORKOUT_SPLITS_STALE_TIME,
  enabled: Boolean(uid) && enabled,
});
