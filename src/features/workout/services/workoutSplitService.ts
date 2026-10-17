import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import type { WorkoutSplit } from '../types';
import { clearSplitsCache } from './splitCache';
import { fetchTemplatesFromFirestore } from './workoutTemplateService';
import {
  hydrateSplitSchedules,
  sanitizeSplitDay,
  sanitizeSplitSchedule,
} from './workoutSplitData';

export const fetchSplitsFromFirestore = async (): Promise<WorkoutSplit[]> => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const splitsQuery = query(
      collection(db, 'workoutSplits'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
    const querySnapshot = await getDocs(splitsQuery);
    if (querySnapshot.empty) {
      console.log('No splits found');
      return [];
    }

    const splits: WorkoutSplit[] = querySnapshot.docs.map(docSnap => ({
      ...(docSnap.data() as WorkoutSplit),
      id: docSnap.id,
    }));
    const templates = await fetchTemplatesFromFirestore();
    return hydrateSplitSchedules(splits, templates);
  } catch (error) {
    console.error('Error fetching user splits from Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateSplitInFirestore = async (
  splitId: string,
  splitData: Partial<WorkoutSplit>,
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!splitId) {
      throw new Error('Split ID is required for update');
    }

    const splitRef = doc(db, 'workoutSplits', splitId);

    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (splitData.name !== undefined) updateData['name'] = splitData.name;
    if (splitData.description !== undefined) updateData['description'] = splitData.description;
    if (splitData.type !== undefined) updateData['type'] = splitData.type;
    if (splitData.schedule !== undefined) updateData['schedule'] = splitData.schedule;
    if (splitData.durationWeeks !== undefined) updateData['durationWeeks'] = splitData.durationWeeks;

    await updateDoc(splitRef, updateData);
    await clearSplitsCache();
    return splitId;
  } catch (error) {
    console.error('Error updating split:', error);
    throw error;
  }
};

export const addSplitToFirestore = async (splitData: WorkoutSplit): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const splitDataToSave = {
      ...splitData,
      schedule: sanitizeSplitSchedule(splitData.schedule),
      uid: user.uid,
      createdAt: serverTimestamp(),
    };

    const splitDocRef = doc(collection(db, 'workoutSplits'));
    await setDoc(splitDocRef, splitDataToSave);
    await clearSplitsCache();
    return splitDocRef.id;
  } catch (error) {
    console.error('Error saving split to Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateSplitDay = async (
  splitId: string,
  day: string,
  workoutData: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const splitDocRef = doc(db, 'workoutSplits', splitId);
    await updateDoc(splitDocRef, {
      [`schedule.${day}`]: sanitizeSplitDay(workoutData),
      lastModified: serverTimestamp(),
    });

    await clearSplitsCache();
    return true;
  } catch (error) {
    console.error('Error updating split day:', (error as Error).message);
    throw error;
  }
};

export const deleteSplitFromFirestore = async (splitId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const splitDocRef = doc(db, 'workoutSplits', splitId);
    await deleteDoc(splitDocRef);
    await clearSplitsCache();
    return true;
  } catch (error) {
    console.error('Error deleting split from Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateSplitProgress = async (splitId: string, currentWeek: number): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const splitDocRef = doc(db, 'workoutSplits', splitId);
    await updateDoc(splitDocRef, {
      currentWeek,
      lastUpdated: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating split progress:', (error as Error).message);
    throw error;
  }
};
