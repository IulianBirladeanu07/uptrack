import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type FirebaseExtra = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
};

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
  firebaseMeasurementId,
}: FirebaseExtra = Constants.expoConfig?.extra ?? {};

if (!firebaseApiKey || !firebaseProjectId) {
  throw new Error('Missing required Firebase configuration');
}

const firebaseConfig: FirebaseOptions = {
  apiKey: firebaseApiKey,
  projectId: firebaseProjectId,
  ...(firebaseAuthDomain && { authDomain: firebaseAuthDomain }),
  ...(firebaseStorageBucket && { storageBucket: firebaseStorageBucket }),
  ...(firebaseMessagingSenderId && { messagingSenderId: firebaseMessagingSenderId }),
  ...(firebaseAppId && { appId: firebaseAppId }),
  ...(firebaseMeasurementId && { measurementId: firebaseMeasurementId }),
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const initAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
};

const auth = initAuth();

const db = getFirestore(app);

export { app, auth, db };
