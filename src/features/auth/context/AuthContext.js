import { createContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveStartWeight } from '../../nutrition/helpers/learningCompletionService';

export const AuthContext = createContext();

const deriveAndSaveStartWeight = async (userId, data) => {
  if (data.startWeight || !data.weightIns?.length) return data;

  const startWeight = deriveStartWeight(data.weightIns);
  if (!startWeight) return data;

  await setDoc(doc(db, 'users', userId), { startWeight }, { merge: true });
  return { ...data, startWeight };
};

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [userData, setUserData] = useState(null);
  const handledRef = useRef(false);

  const refreshUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = await deriveAndSaveStartWeight(user.uid, userDoc.data() || {});
      setUserData(data);
      return data;
    } catch (error) {
      console.error('refreshUserData error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = await deriveAndSaveStartWeight(user.uid, userDoc.data() || {});

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
        handledRef.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthenticated(false);
      setProfileSetupComplete(false);
      setUserData(null);
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      authenticated,
      loading,
      userData,
      setAuthenticated,
      profileSetupComplete,
      setProfileSetupComplete,
      logout,
      refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};