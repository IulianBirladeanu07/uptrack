import { signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../auth/services/firebaseConfigService'
import Constants from 'expo-constants';

const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'auth/wrong-password':
      return 'Invalid password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/email-already-in-use':
      return 'Email is already in use. Please use a different email.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again later.';
  }
};

const signInWithEmailAndPassword = async (email, password, setAuthenticated, setProfileSetupComplete) => {
  try {
    const response = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const user = response.user;

    if (!user.emailVerified) {
      throw new Error('Email not verified. Please verify your email before logging in.');
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data() || {};

    setAuthenticated(true);
    setProfileSetupComplete(userData.profileSetupComplete || false);
  } catch (error) {
    console.error('Error during sign-in:', error);
  }
};

const signInWithGoogle = async (googleResponse, setAuthenticated, setProfileSetupComplete) => {
  const { id_token } = googleResponse.params;
  const credential = GoogleAuthProvider.credential(id_token);

  try {
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
  } catch (error) {
    console.error('Error signing in with Google:', error.message);
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

const sendPasswordResetEmail = async (email) => {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw new Error(handleFirebaseError(error));
  }
};

const getGoogleAndroidClientId = () => {
  return Constants.expoConfig.extra.googleAndroidClientId;
};

const getGoogleWebClientId = () => {
  return Constants.expoConfig.extra.googleWebClientId;
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
  signInWithGoogle,
  sendPasswordResetEmail,
  getGoogleAndroidClientId,
  getGoogleWebClientId,
  getCurrentUser,
};