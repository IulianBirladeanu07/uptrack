import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import type { MealDayDoc, UserData } from '../types';

export const userConverter: FirestoreDataConverter<UserData> = {
  toFirestore(user: UserData): DocumentData {
    return { ...user };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions,
  ): UserData {
    return snapshot.data(options) as UserData;
  },
};

export const mealDayConverter: FirestoreDataConverter<MealDayDoc> = {
  toFirestore(day: MealDayDoc): DocumentData {
    return { ...day };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions,
  ): MealDayDoc {
    return snapshot.data(options) as MealDayDoc;
  },
};
