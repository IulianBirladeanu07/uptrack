import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleAuthStateChange = async (user) => {
    setLoading(true);
    try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        const isProfileComplete = !!userData.profileSetupComplete;

        setAuthenticated(true);
        setProfileSetupComplete(isProfileComplete);
        setUserData(userData);
        await AsyncStorage.setItem('auth_token', user.uid);
        console.info('User authenticated', { userId: user.uid });
      } else {
        setAuthenticated(false);
        setProfileSetupComplete(false);
        setUserData(null);
        await AsyncStorage.removeItem('auth_token');
        console.info('User signed out');
      }
    } catch (error) {
      console.error('Error handling auth state change', { error });
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const updatedUserData = userDoc.data() || {};
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Error refreshing user data', { error });
    }
  };

  useEffect(() => {
    const checkAuthState = async () => {
      const savedToken = await AsyncStorage.getItem('auth_token');
      if (savedToken) {
        const currentUser = await getAuth().currentUser;
        if (currentUser) {
          console.info('User is authenticated from persisted session', { userId: currentUser.uid });
          handleAuthStateChange(currentUser);
        } else {
          console.info('No active session found');
          await AsyncStorage.removeItem('auth_token');
        }
      } else {
        console.info('No saved token found');
      }
    };

    checkAuthState();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      handleAuthStateChange(user);
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
      console.info('User logged out');
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
