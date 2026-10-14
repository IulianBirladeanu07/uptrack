import { signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../auth/services/firebaseConfigService';
import Constants from 'expo-constants';
import { needsEmailVerification } from '../utils/emailVerification';
import type { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { UserData } from '../../../shared/types';

type SetFlag = (value: boolean) => void;

const handleFirebaseError = (error: unknown): string => {
  switch ((error as FirebaseError).code) {
    case 'auth/wrong-password':
      return 'Invalid password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'Email is already in use. Please use a different email.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again later.';
  }
};

const signInWithEmailAndPassword = async (
  email: string,
  password: string,
  setAuthenticated: SetFlag,
  setProfileSetupComplete: SetFlag,
): Promise<void> => {
  const response = await firebaseSignInWithEmailAndPassword(auth, email, password);
  const user = response.user;

  if (needsEmailVerification(user)) {
    await signOut(auth);
    throw Object.assign(
      new Error('Email not verified. Please verify your email before logging in.'),
      { code: 'auth/email-not-verified' },
    );
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = (userDoc.data() || {}) as UserData;

  setAuthenticated(true);
  setProfileSetupComplete(userData.profileSetupComplete || false);
};

const signUpWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  try {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    const user = response.user;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email,
        profileSetupComplete: false,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(user);
    } finally {
      await signOut(auth);
    }

    return user;
  } catch (error) {
    throw new Error(handleFirebaseError(error));
  }
};

const resendVerificationEmail = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const user = response.user;

    if (!needsEmailVerification(user)) return false;

    try {
      await sendEmailVerification(user);
    } finally {
      await signOut(auth);
    }

    return true;
  } catch (error) {
    throw new Error(handleFirebaseError(error));
  }
};

const signInWithGoogle = async (
  googleResponse: { params: { id_token: string } },
  setAuthenticated: SetFlag,
  setProfileSetupComplete: SetFlag,
): Promise<void> => {
  const { id_token } = googleResponse.params;
  const credential = GoogleAuthProvider.credential(id_token);

  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  const { uid, email, displayName, photoURL } = user;
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const existing = userDoc.data() as UserData;
    await updateDoc(userDocRef, {
      displayName: displayName || existing.displayName,
      photoURL: photoURL || existing.photoURL,
      lastLogin: serverTimestamp(),
    });
  } else {
    await setDoc(userDocRef, {
      email,
      displayName,
      photoURL,
      profileSetupComplete: false,
      createdAt: serverTimestamp(),
    });
  }

  const userData = (await getDoc(userDocRef)).data() as UserData;
  setAuthenticated(true);
  setProfileSetupComplete(userData.profileSetupComplete || false);
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    if ((error as FirebaseError).code === 'auth/user-not-found') return;
    throw new Error(handleFirebaseError(error));
  }
};

type GoogleExtra = { extra: { googleAndroidClientId?: string; googleWebClientId?: string } };

const getGoogleAndroidClientId = () => {
  return (Constants.expoConfig as GoogleExtra).extra.googleAndroidClientId;
};

const getGoogleWebClientId = () => {
  return (Constants.expoConfig as GoogleExtra).extra.googleWebClientId;
};

export const fetchUserProfile = async (uid: string): Promise<UserData | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? (userDoc.data() as UserData) : null;
};

export const getCurrentUser = (): User => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  return user;
};

export default {
  signInWithEmailAndPassword,
  signUpWithEmailAndPassword,
  resendVerificationEmail,
  signInWithGoogle,
  sendPasswordResetEmail,
  getGoogleAndroidClientId,
  getGoogleWebClientId,
  getCurrentUser,
};