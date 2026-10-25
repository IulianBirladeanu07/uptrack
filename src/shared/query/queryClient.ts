import { QueryClient } from '@tanstack/react-query';

export const DEFAULT_QUERY_STALE_TIME = 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_QUERY_STALE_TIME,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const USER_SCOPED_QUERY_ROOTS = new Set([
  'exercise-catalog',
  'meal-history',
  'workout-history',
  'workout-splits',
  'workout-templates',
  'user-profile',
]);

export const clearUserScopedQueries = (): void => {
  queryClient.removeQueries({
    predicate: query => USER_SCOPED_QUERY_ROOTS.has(String(query.queryKey[0])),
  });
};
