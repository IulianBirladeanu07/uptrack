import { useQuery } from '@tanstack/react-query';
import { loadTemplatesFromFirestore } from '../services/workoutTemplateService';
import { workoutTemplateQueryKey } from '../services/workoutQueryKeys';

const WORKOUT_TEMPLATES_STALE_TIME = 5 * 60 * 1000;

export const useWorkoutTemplates = (
  uid: string | null | undefined,
  enabled = true,
) => useQuery({
  queryKey: workoutTemplateQueryKey(uid ?? ''),
  queryFn: () => {
    if (!uid) throw new Error('User not authenticated.');
    return loadTemplatesFromFirestore(uid);
  },
  staleTime: WORKOUT_TEMPLATES_STALE_TIME,
  enabled: Boolean(uid) && enabled,
});
