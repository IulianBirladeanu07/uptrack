import { doc, getDoc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfigService';
import type { UserData } from '../../../shared/types';
import { queryClient } from '../../../shared/query/queryClient';

export const userProfileQueryKey = (uid: string) => ['user-profile', uid] as const;

export const fetchUserProfileQuery = (
  uid: string,
  queryFn: () => Promise<UserData | null>,
  staleTime = 0,
): Promise<UserData | null> => queryClient.fetchQuery({
  queryKey: userProfileQueryKey(uid),
  queryFn,
  staleTime,
  retry: false,
});

const mergeProfileData = (current: Record<string, unknown>, update: Record<string, unknown>): Record<string, unknown> =>
  Object.entries(update).reduce<Record<string, unknown>>((merged, [key, value]) => {
    const currentValue = current[key];
    const isPlainObject = (candidate: unknown): candidate is Record<string, unknown> =>
      candidate !== null && typeof candidate === 'object' &&
      (Object.getPrototypeOf(candidate) === Object.prototype || Object.getPrototypeOf(candidate) === null);
    merged[key] = isPlainObject(currentValue) && isPlainObject(value)
      ? mergeProfileData(currentValue, value)
      : value;
    return merged;
  }, { ...current });

export const mergeUserProfile = async (
  uid: string,
  data: Record<string, unknown>,
  invalidate = false,
): Promise<void> => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
  if (invalidate) {
    await queryClient.invalidateQueries({ queryKey: userProfileQueryKey(uid), exact: true });
    return;
  }
  queryClient.setQueryData<UserData | null>(userProfileQueryKey(uid), current =>
    current ? mergeProfileData(current as Record<string, unknown>, data) as UserData : current,
  );
};

export const mergeUserProfileTransaction = async (
  uid: string,
  getUpdate: (current: UserData | null) => Record<string, unknown> | null,
): Promise<boolean> => {
  let update: Record<string, unknown> | null = null;
  await runTransaction(db, async transaction => {
    const userRef = doc(db, 'users', uid);
    const snapshot = await transaction.get(userRef);
    update = getUpdate(snapshot.exists() ? snapshot.data() as UserData : null);
    if (update) transaction.set(userRef, update, { merge: true });
  });
  const committedUpdate = update;
  if (!committedUpdate) return false;
  queryClient.setQueryData<UserData | null>(userProfileQueryKey(uid), current =>
    current ? mergeProfileData(current as Record<string, unknown>, committedUpdate) as UserData : current,
  );
  return true;
};

export const updateUserProfile = async (uid: string, data: Record<string, unknown>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
  await queryClient.invalidateQueries({ queryKey: userProfileQueryKey(uid), exact: true });
};

export const loadUserProfileDocument = async (uid: string): Promise<UserData | null> => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() as UserData : null;
};

export const fetchUserProfileDocument = (uid: string, staleTime = 0): Promise<UserData | null> =>
  fetchUserProfileQuery(uid, () => loadUserProfileDocument(uid), staleTime);
