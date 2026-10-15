import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { userConverter } from '../../../shared/firestore/converters';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveStartWeight } from '../../nutrition/helpers/learningCompletionService';
import { RECENT_SEARCHES_KEY } from '../../nutrition/helpers/useRecentSearches';
import { SPLITS_CACHE_KEY } from '../../workout/handlers/WorkoutHandler';
import { SEARCH } from '../../../shared/theme/constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { UserData } from '../../../shared/types';
import { needsEmailVerification } from '../utils/emailVerification';
import { isCurrentAuthRequest } from '../utils/authRequest';
import { syncAuthEmail } from '../services/emailSyncService';

export type AuthContextValue = {
  authenticated: boolean;
  loading: boolean;
  userData: UserData | null;
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  profileSetupComplete: boolean;
  setProfileSetupComplete: Dispatch<SetStateAction<boolean>>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<UserData | undefined>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_DEFAULTS = {
  autoAdjustEnabled:   true,
  weeksSinceCutStart:  0,
};

const deriveAndSaveStartWeight = async (userId: string, data: UserData): Promise<UserData> => {
  if (data.startWeight || !data.weightIns?.length) return data;

  const startWeight = deriveStartWeight(data.weightIns);
  if (!startWeight) return data;

  await setDoc(doc(db, 'users', userId), { startWeight }, { merge: true });
  return { ...data, startWeight };
};

const applyProfileDefaults = async (userId: string, data: UserData): Promise<UserData> => {
  const missing: Record<string, unknown> = {};
  Object.entries(PROFILE_DEFAULTS).forEach(([key, value]) => {
    if (data[key as keyof UserData] === undefined) missing[key] = value;
  });
  if (!Object.keys(missing).length) return data;

  await setDoc(doc(db, 'users', userId), missing, { merge: true });
  return { ...data, ...missing };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const authRequestGeneration = useRef(0);

  const refreshUserData = useCallback(async (): Promise<UserData | undefined> => {
    const user = auth.currentUser;
    if (!user) return undefined;
    const request = { uid: user.uid, generation: authRequestGeneration.current };
    const isCurrent = () =>
      isCurrentAuthRequest(request, auth.currentUser?.uid ?? null, authRequestGeneration.current);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid).withConverter(userConverter));
      if (!isCurrent()) return undefined;
      let data = await deriveAndSaveStartWeight(user.uid, userDoc.data() ?? {});
      if (!isCurrent()) return undefined;
      data = await applyProfileDefaults(user.uid, data);
      if (!isCurrent()) return undefined;
      setUserData(data);
      return data;
    } catch (error) {
      console.error('refreshUserData error:', error);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const request = {
        uid: user?.uid ?? null,
        generation: authRequestGeneration.current + 1,
      };
      authRequestGeneration.current = request.generation;
      const isCurrent = () =>
        isCurrentAuthRequest(request, auth.currentUser?.uid ?? null, authRequestGeneration.current);
      setLoading(true);
      setAuthenticated(false);
      setProfileSetupComplete(false);
      setUserData(null);
      try {
        if (user && !needsEmailVerification(user)) {
          const userDoc = await getDoc(doc(db, 'users', user.uid).withConverter(userConverter));
          if (!isCurrent()) return;
          let data = await deriveAndSaveStartWeight(user.uid, userDoc.data() ?? {});
          if (!isCurrent()) return;
          data = await applyProfileDefaults(user.uid, data);
          if (!isCurrent()) return;
          data = await syncAuthEmail(user.uid, user.email, data);
          if (!isCurrent()) return;

          setAuthenticated(true);
          setProfileSetupComplete(!!data.profileSetupComplete);
          setUserData(data);
          await AsyncStorage.setItem('auth_token', user.uid);
        } else {
          if (!isCurrent()) return;
          await AsyncStorage.multiRemove(['auth_token', SPLITS_CACHE_KEY, RECENT_SEARCHES_KEY, SEARCH.STORAGE_KEY]);
        }
      } catch (error) {
        if (isCurrent()) console.error('onAuthStateChanged error:', error);
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });

    return () => {
      authRequestGeneration.current += 1;
      unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('GoogleSignin signOut error:', error);
    }

    try {
      await signOut(auth);
      setAuthenticated(false);
      setProfileSetupComplete(false);
      setUserData(null);
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('logout error:', error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    authenticated,
    loading,
    userData,
    setAuthenticated,
    profileSetupComplete,
    setProfileSetupComplete,
    logout,
    refreshUserData,
  }), [authenticated, loading, userData, profileSetupComplete, logout, refreshUserData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};