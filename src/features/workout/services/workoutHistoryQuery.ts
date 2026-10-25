import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import type {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { queryClient } from '../../../shared/query/queryClient';
import { workoutHistoryQueryKeys } from './workoutQueryKeys';

const WORKOUT_HISTORY_STALE_TIME = 5 * 60 * 1000;
export const WORKOUT_HISTORY_PAGE_SIZE = 100;

export type WorkoutHistoryRecord = {
  id: string;
  data: DocumentData;
};

export type WorkoutHistoryPage = {
  records: WorkoutHistoryRecord[];
  hasMore: boolean;
  lastDocument: QueryDocumentSnapshot<DocumentData> | null;
};

export const fetchWorkoutHistoryPage = async (
  uid: string,
  pageSize: number,
  after: QueryDocumentSnapshot<DocumentData> | null,
): Promise<WorkoutHistoryPage> => {
  const constraints: QueryConstraint[] = [
    where('uid', '==', uid),
    orderBy('timestamp', 'desc'),
  ];
  if (after) constraints.push(startAfter(after));
  const querySnapshot = await getDocs(query(
    collection(db, 'workoutHistory'),
    ...constraints,
    limit(pageSize),
  ));
  const lastDocument = querySnapshot.docs.at(-1) ?? null;
  return {
    records: querySnapshot.docs.map(workout => ({
      id: workout.id,
      data: workout.data(),
    })),
    hasMore: querySnapshot.docs.length === pageSize,
    lastDocument,
  };
};

export const fetchUserWorkoutHistoryPage = async (
  uid: string,
  pageSize: number,
  pageIndex: number,
): Promise<WorkoutHistoryPage> => queryClient.fetchQuery({
  queryKey: workoutHistoryQueryKeys.page(uid, pageSize, pageIndex),
  staleTime: WORKOUT_HISTORY_STALE_TIME,
  retry: false,
  queryFn: async () => {
    const previousPage = pageIndex > 0
      ? await fetchUserWorkoutHistoryPage(uid, pageSize, pageIndex - 1)
      : null;
    if (previousPage && (!previousPage.hasMore || !previousPage.lastDocument)) {
      return { records: [], hasMore: false, lastDocument: null };
    }

    return fetchWorkoutHistoryPage(uid, pageSize, previousPage?.lastDocument ?? null);
  },
});

export const fetchUserWorkoutHistory = async (
  uid: string,
  maxResults: number | null,
): Promise<WorkoutHistoryRecord[]> => {
  if (maxResults === 0) return [];
  if (
    maxResults !== null &&
    maxResults >= 0 &&
    maxResults <= WORKOUT_HISTORY_PAGE_SIZE
  ) {
    const firstPage = await fetchUserWorkoutHistoryPage(uid, WORKOUT_HISTORY_PAGE_SIZE, 0);
    return firstPage.records.slice(0, maxResults);
  }

  return queryClient.fetchQuery({
    queryKey: workoutHistoryQueryKeys.history(uid, maxResults),
    staleTime: WORKOUT_HISTORY_STALE_TIME,
    retry: false,
    queryFn: async () => {
      const workoutsRef = collection(db, 'workoutHistory');
      const constraints: QueryConstraint[] = [
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
      ];
      const workoutQuery = maxResults === null
        ? query(workoutsRef, ...constraints)
        : query(workoutsRef, ...constraints, limit(maxResults));
      const querySnapshot = await getDocs(workoutQuery);
      return querySnapshot.docs.map(workout => ({
        id: workout.id,
        data: workout.data(),
      }));
    },
  });
};

export const fetchUserWorkoutHistoryInRange = async (
  uid: string,
  start: Date,
  end: Date,
): Promise<WorkoutHistoryRecord[]> => queryClient.fetchQuery({
  queryKey: workoutHistoryQueryKeys.range(uid, start, end),
  staleTime: WORKOUT_HISTORY_STALE_TIME,
  retry: false,
  queryFn: async () => {
    const workoutsRef = collection(db, 'workoutHistory');
    const workoutQuery = query(
      workoutsRef,
      where('uid', '==', uid),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<', Timestamp.fromDate(end)),
      orderBy('timestamp', 'desc'),
    );
    const querySnapshot = await getDocs(workoutQuery);
    return querySnapshot.docs.map(workout => ({
      id: workout.id,
      data: workout.data(),
    }));
  },
});
