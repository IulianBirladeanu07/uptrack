import { createContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [userData, setUserData] = useState(null);
  const handledRef = useRef(false);

  const refreshUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserData(userDoc.data() || {});
      }
    } catch (error) {
      console.error('Error refreshing user data', { error });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (handledRef.current) return;
      handledRef.current = true;

      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.data() || {};

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
        console.error('Error handling auth state change', { error });
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
      console.error('Error during logout', { error });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        loading,
        userData,
        setAuthenticated,
        profileSetupComplete,
        setProfileSetupComplete,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};