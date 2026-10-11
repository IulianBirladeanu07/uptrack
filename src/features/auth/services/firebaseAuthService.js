import { signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../auth/services/firebaseConfigService';
import Constants from 'expo-constants';
import { needsEmailVerification } from '../utils/emailVerification';

const handleFirebaseError = (error) => {
  switch (error.code) {
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

const signInWithEmailAndPassword = async (email, password, setAuthenticated, setProfileSetupComplete) => {
  const response = await firebaseSignInWithEmailAndPassword(auth, email, password);
  const user = response.user;

  if (needsEmailVerification(user)) {
    await signOut(auth);
    const error = new Error('Email not verified. Please verify your email before logging in.');
    error.code = 'auth/email-not-verified';
    throw error;
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data() || {};

  setAuthenticated(true);
  setProfileSetupComplete(userData.profileSetupComplete || false);
};

const signUpWithEmailAndPassword = async (email, password) => {
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

const resendVerificationEmail = async (email, password) => {
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

const signInWithGoogle = async (googleResponse, setAuthenticated, setProfileSetupComplete) => {
  const { id_token } = googleResponse.params;
  const credential = GoogleAuthProvider.credential(id_token);

  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  const { uid, email, displayName, photoURL } = user;
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    await updateDoc(userDocRef, {
      displayName: displayName || userDoc.data().displayName,
      photoURL: photoURL || userDoc.data().photoURL,
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

  const userData = (await getDoc(userDocRef)).data();
  setAuthenticated(true);
  setProfileSetupComplete(userData.profileSetupComplete || false);
};

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') return;
    throw new Error(handleFirebaseError(error));
  }
};

const getGoogleAndroidClientId = () => {
  return Constants.expoConfig.extra.googleAndroidClientId;
};

const getGoogleWebClientId = () => {
  return Constants.expoConfig.extra.googleWebClientId;
};

export const fetchUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() : null;
};

export const getCurrentUser = () => {
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