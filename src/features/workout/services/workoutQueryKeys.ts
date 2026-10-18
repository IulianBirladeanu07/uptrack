export const workoutHistoryQueryKeys = {
  forUser: (uid: string) => ['workout-history', uid] as const,
  history: (uid: string, maxResults: number | null) =>
    [...workoutHistoryQueryKeys.forUser(uid), maxResults] as const,
  page: (uid: string, pageSize: number, pageIndex: number) =>
    [...workoutHistoryQueryKeys.forUser(uid), 'page', pageSize, pageIndex] as const,
  range: (uid: string, start: Date, end: Date) =>
    [...workoutHistoryQueryKeys.forUser(uid), 'range', start.toISOString(), end.toISOString()] as const,
};

export const workoutTemplateQueryKey = (uid: string) => ['workout-templates', uid] as const;
export const workoutSplitQueryKey = (uid: string) => ['workout-splits', uid] as const;
