import { collection, doc, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { deleteUser, reauthenticateWithCredential } from 'firebase/auth';
import type { AuthCredential, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import { workoutService } from '../../workout/services/WorkoutService';

const OWNED_COLLECTIONS = ['meals', 'workoutHistory', 'workoutTemplates', 'workoutSplits', 'measurements', 'customExercises'];
const BATCH_SIZE = 400;

const deleteOwned = async (name: string, uid: string): Promise<void> => {
  const snap = await getDocs(query(collection(db, name), where('uid', '==', uid)));
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH_SIZE).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
};

const deletePicture = async (uid: string): Promise<void> => {
  try {
    await deleteObject(ref(getStorage(), `profilePictures/${uid}.jpg`));
  } catch (e) {
    if ((e as { code?: string }).code !== 'storage/object-not-found') throw e;
  }
};

const clearLocal = async (uid: string): Promise<void> => {
  await workoutService.setUser(null);
  const keys = await AsyncStorage.getAllKeys();
  const own = keys.filter(k => k.endsWith(uid));
  if (own.length) await AsyncStorage.multiRemove(own);
};

export const deleteAccount = async (user: User, credential: AuthCredential): Promise<void> => {
  await reauthenticateWithCredential(user, credential);
  const uid = user.uid;

  await deletePicture(uid);
  for (const name of OWNED_COLLECTIONS) await deleteOwned(name, uid);
  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(user);

  try {
    await clearLocal(uid);
  } catch (error) {
    console.error('deleteAccount local cleanup error:', error);
  }
};
