import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveStartWeight } from '../../nutrition/helpers/learningCompletionService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const AuthContext = createContext();

const PROFILE_DEFAULTS = {
  autoAdjustEnabled:   true,
  weeksSinceCutStart:  0,
};

const deriveAndSaveStartWeight = async (userId, data) => {
  if (data.startWeight || !data.weightIns?.length) return data;

  const startWeight = deriveStartWeight(data.weightIns);
  if (!startWeight) return data;

  await setDoc(doc(db, 'users', userId), { startWeight }, { merge: true });
  return { ...data, startWeight };
};

const applyProfileDefaults = async (userId, data) => {
  const missing = {};
  Object.entries(PROFILE_DEFAULTS).forEach(([key, value]) => {
    if (data[key] === undefined) missing[key] = value;
  });
  if (!Object.keys(missing).length) return data;

  await setDoc(doc(db, 'users', userId), missing, { merge: true });
  return { ...data, ...missing };
};

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [userData, setUserData] = useState(null);

  const refreshUserData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let data = await deriveAndSaveStartWeight(user.uid, userDoc.data() || {});
      data = await applyProfileDefaults(user.uid, data);
      setUserData(data);
      return data;
    } catch (error) {
      console.error('refreshUserData error:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let data = await deriveAndSaveStartWeight(user.uid, userDoc.data() || {});
          data = await applyProfileDefaults(user.uid, data);

          setAuthenticated(true);
          setProfileSetupComplete(!!data.profileSetupComplete);
          setUserData(data);
          await AsyncStorage.setItem('auth_token', user.uid);
        } else {
          setAuthenticated(false);
          setProfileSetupComplete(false);
          setUserData(null);
          await AsyncStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('onAuthStateChanged error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
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