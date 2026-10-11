import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfigService';
import type { UserData } from '../../../shared/types';

export const syncAuthEmail = async (uid: string, authEmail: string | null | undefined, data: UserData): Promise<UserData> => {
  if (!authEmail || data.email === authEmail) return data;
  try {
    await setDoc(doc(db, 'users', uid), { email: authEmail }, { merge: true });
    return { ...data, email: authEmail };
  } catch (error) {
    console.error('syncAuthEmail error:', error);
    return data;
  }
};
