import type { UserData } from '../../../shared/types';
import { mergeUserProfile } from './userProfileQuery';

export const syncAuthEmail = async (uid: string, authEmail: string | null | undefined, data: UserData): Promise<UserData> => {
  if (!authEmail || data.email === authEmail) return data;
  try {
    await mergeUserProfile(uid, { email: authEmail });
    return { ...data, email: authEmail };
  } catch (error) {
    console.error('syncAuthEmail error:', error);
    return data;
  }
};
