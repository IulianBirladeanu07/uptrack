import { signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, OAuthProvider, signInWithCredential, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../auth/services/firebaseConfigService';
import Constants from 'expo-constants';
import { needsEmailVerification } from '../utils/emailVerification';
import type { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { UserData } from '../../../shared/types';
import { getAuthErrorMessage } from '../utils/authErrorMessage';

type SetFlag = (value: boolean) => void;

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
  let user: User;
  try {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    user = response.user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error, 'signUp'));
  }

  try {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email,
        profileSetupComplete: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      throw new Error("Your account was created, but we couldn't finish setting it up. Please contact support before trying to register again.");
    }

    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, 'verification'));
    }
  } finally {
    await signOut(auth);
  }

  return user;
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
    throw new Error(getAuthErrorMessage(error, 'resendVerification'));
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
    const update: Record<string, unknown> = { lastLogin: serverTimestamp() };
    const nextName = displayName || existing.displayName;
    const nextPhoto = photoURL || existing.photoURL;
    if (nextName) update['displayName'] = nextName;
    if (nextPhoto) update['photoURL'] = nextPhoto;
    await updateDoc(userDocRef, update);
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

type AppleFullName = {
  givenName: string | null;
  middleName: string | null;
  familyName: string | null;
};

const signInWithApple = async (
  identityToken: string,
  rawNonce: string,
  appleProfile: { email: string | null; fullName: AppleFullName | null },
  setAuthenticated: SetFlag,
  setProfileSetupComplete: SetFlag,
): Promise<void> => {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce });
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;
  const appleName = appleProfile.fullName
    ? [appleProfile.fullName.givenName, appleProfile.fullName.middleName, appleProfile.fullName.familyName]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(' ')
    : '';
  const displayName = user.displayName || appleName || undefined;
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const existing = userDoc.data() as UserData;
    const update: Record<string, unknown> = { lastLogin: serverTimestamp() };
    if (!existing.displayName && displayName) update['displayName'] = displayName;
    if (!existing.email && (user.email || appleProfile.email)) {
      update['email'] = user.email || appleProfile.email;
    }
    await updateDoc(userDocRef, update);
  } else {
    const newUser: Record<string, unknown> = {
      profileSetupComplete: false,
      createdAt: serverTimestamp(),
    };
    const email = user.email || appleProfile.email;
    if (email) newUser['email'] = email;
    if (displayName) newUser['displayName'] = displayName;
    await setDoc(userDocRef, newUser);
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
    throw new Error(getAuthErrorMessage(error, 'passwordReset'));
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
  signInWithApple,
  sendPasswordResetEmail,
  getGoogleAndroidClientId,
  getGoogleWebClientId,
  getCurrentUser,
};