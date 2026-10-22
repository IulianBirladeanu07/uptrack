import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { AppState } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { userConverter } from '../../../shared/firestore/converters';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveStartWeight } from '../../nutrition/helpers/learningCompletionService';
import { RECENT_SEARCHES_KEY } from '../../nutrition/helpers/useRecentSearches';
import { SPLITS_CACHE_KEY } from '../../workout/services/splitCache';
import { SEARCH } from '../../../shared/theme/constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { UserData } from '../../../shared/types';
import { needsEmailVerification } from '../utils/emailVerification';
import { isCurrentAuthRequest, isSameAuthIdentity } from '../utils/authRequest';
import { syncAuthEmail } from '../services/emailSyncService';
import { clearUserScopedQueries } from '../../../shared/query/queryClient';

export type AuthContextValue = {
  authenticated: boolean;
  loading: boolean;
  userData: UserData | null;
  /** True when the session is kept from a local cache because Firestore was unreachable. */
  isOffline: boolean;
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  profileSetupComplete: boolean;
  setProfileSetupComplete: Dispatch<SetStateAction<boolean>>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<UserData | undefined>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_DEFAULTS = {
  autoAdjustEnabled: true,
  weeksSinceCutStart: 0,
};

const userCacheKey = (uid: string) => `user_${uid}`;

const readCachedUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const raw = await AsyncStorage.getItem(userCacheKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
};

const writeCachedUserData = async (uid: string, data: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(userCacheKey(uid), JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache user profile:', error);
  }
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
  const [isOffline, setIsOffline] = useState(false);
  const authRequestGeneration = useRef(0);
  const previousAuthUid = useRef<string | null | undefined>(undefined);
  const previousWasUnverified = useRef(false);

  const applyOnlineProfile = async (
    uid: string,
    email: string | null,
    isCurrent: () => boolean,
  ): Promise<UserData | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid).withConverter(userConverter));
    if (!isCurrent()) return null;
    let data = await deriveAndSaveStartWeight(uid, userDoc.data() ?? {});
    if (!isCurrent()) return null;
    data = await applyProfileDefaults(uid, data);
    if (!isCurrent()) return null;
    data = await syncAuthEmail(uid, email, data);
    if (!isCurrent()) return null;
    await writeCachedUserData(uid, data);
    return data;
  };

  const refreshUserData = useCallback(async (): Promise<UserData | undefined> => {
    const user = auth.currentUser;
    if (!user) return undefined;
    const request = { uid: user.uid, generation: authRequestGeneration.current };
    const isCurrent = () =>
      isCurrentAuthRequest(request, auth.currentUser?.uid ?? null, authRequestGeneration.current);
    try {
      const data = await applyOnlineProfile(user.uid, user.email, isCurrent);
      if (!isCurrent() || !data) return undefined;
      setUserData(data);
      setProfileSetupComplete(!!data.profileSetupComplete);
      setIsOffline(false);
      return data;
    } catch (error) {
      console.error('refreshUserData error:', error);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const nextUid = user?.uid ?? null;
      const preserveCurrentState = isSameAuthIdentity(previousAuthUid.current, nextUid);
      previousAuthUid.current = nextUid;
      const unverified = needsEmailVerification(user);
      const keepScreen = unverified || (user === null && previousWasUnverified.current);
      previousWasUnverified.current = unverified;
      if (!preserveCurrentState) clearUserScopedQueries();
      const request = {
        uid: nextUid,
        generation: authRequestGeneration.current + 1,
      };
      authRequestGeneration.current = request.generation;
      const isCurrent = () =>
        isCurrentAuthRequest(request, auth.currentUser?.uid ?? null, authRequestGeneration.current);
      if (!preserveCurrentState) {
        if (!keepScreen) setLoading(true);
        setAuthenticated(false);
        setProfileSetupComplete(false);
        setUserData(null);
        setIsOffline(false);
      }
      try {
        if (user && !needsEmailVerification(user)) {
          try {
            const data = await applyOnlineProfile(user.uid, user.email, isCurrent);
            if (!isCurrent() || !data) return;
            setAuthenticated(true);
            setProfileSetupComplete(!!data.profileSetupComplete);
            setUserData(data);
            setIsOffline(false);
            await AsyncStorage.setItem('auth_token', user.uid);
          } catch (error) {
            if (!isCurrent()) return;
            const cached = await readCachedUserData(user.uid);
            if (!isCurrent()) return;
            if (cached) {
              setAuthenticated(true);
              setProfileSetupComplete(!!cached.profileSetupComplete);
              setUserData(cached);
              setIsOffline(true);
              await AsyncStorage.setItem('auth_token', user.uid);
              console.error('onAuthStateChanged offline fallback:', error);
            } else {
              console.error('onAuthStateChanged error:', error);
            }
          }
        } else {
          if (!isCurrent()) return;
          setIsOffline(false);
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

  useEffect(() => {
    const onChange = (state: string) => {
      if (state !== 'active') return;
      const user = auth.currentUser;
      if (!user || needsEmailVerification(user)) return;
      void refreshUserData();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refreshUserData]);

  const logout = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('GoogleSignin signOut error:', error);
    }

    try {
      await signOut(auth);
      clearUserScopedQueries();
      setAuthenticated(false);
      setProfileSetupComplete(false);
      setUserData(null);
      setIsOffline(false);
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('logout error:', error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    authenticated,
    loading,
    userData,
    isOffline,
    setAuthenticated,
    profileSetupComplete,
    setProfileSetupComplete,
    logout,
    refreshUserData,
  }), [authenticated, loading, userData, isOffline, profileSetupComplete, logout, refreshUserData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
