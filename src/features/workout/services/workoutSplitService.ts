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
    const templateMap = new Map(templates.map(template => [template.id, template]));

    splits.forEach(split => {
      const schedule = (split.schedule || {}) as Record<string, Record<string, unknown>>;
      Object.keys(schedule).forEach(day => {
        const dayData = schedule[day] || {};
        const templateId = dayData['templateId'] as string | undefined;
        const template = templateId ? templateMap.get(templateId) : undefined;
        if (template) {
          schedule[day] = {
            ...dayData,
            id: template.id ?? templateId,
            templateName: template.templateName || dayData['templateName'],
            exercises: template.exercises || dayData['exercises'],
            duration: template.duration ?? dayData['duration'],
          };
        }
      });
      split.schedule = schedule;
    });

    return splits;
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

    const sanitizedSchedule: Record<string, Record<string, unknown>> = {};
    const schedule = (splitData.schedule || {}) as Record<string, Record<string, unknown>>;
    Object.keys(schedule).forEach(day => {
      const dayData = schedule[day] || {};
      sanitizedSchedule[day] = {
        templateId: dayData['templateId'] || 'rest-day',
        templateName: dayData['templateName'] || 'Rest Day',
        exercises: dayData['exercises'] || [],
        duration: dayData['duration'] || '0',
      };
    });

    const splitDataToSave = {
      ...splitData,
      schedule: sanitizedSchedule,
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
    const sanitizedWorkoutData = {
      templateId: workoutData['templateId'] || 'rest-day',
      templateName: workoutData['templateName'] || 'Rest Day',
      exercises: workoutData['exercises'] || [],
      duration: workoutData['duration'] || '0',
    };

    await updateDoc(splitDocRef, {
      [`schedule.${day}`]: sanitizedWorkoutData,
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
