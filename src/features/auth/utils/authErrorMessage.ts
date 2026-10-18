import type { FirebaseError } from 'firebase/app';

export type AuthErrorAction =
  | 'signIn'
  | 'signUp'
  | 'verification'
  | 'resendVerification'
  | 'passwordReset'
  | 'googleSignIn';

const getErrorCode = (error: unknown): string | undefined =>
  (error as Partial<FirebaseError> | null)?.code;

export const getAuthErrorMessage = (error: unknown, action: AuthErrorAction): string => {
  const code = getErrorCode(error);

  switch (code) {
    case 'auth/too-many-requests':
      if (action === 'signUp') {
        return "We couldn't create your account because sign-up is temporarily limited. Please wait a while before trying again. If this keeps happening, contact support.";
      }
      if (action === 'verification') {
        return "Your account was created, but we couldn't send the verification email because requests are temporarily limited. Wait a while, then go to Login and choose “Resend verification email” when prompted.";
      }
      if (action === 'resendVerification') {
        return "We couldn't resend the verification email because email requests are temporarily limited. Please wait a while and try again.";
      }
      if (action === 'passwordReset') {
        return "We couldn't send a password reset email because requests are temporarily limited. Please wait a while and try again.";
      }
      return "We couldn't sign you in because requests are temporarily limited. Please wait a while, then try again.";
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in or resetting your password.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right. Check it and try again.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password doesn’t match an account. Check your details or reset your password.';
    case 'auth/weak-password':
      return 'Choose a stronger password and try again.';
    case 'auth/network-request-failed':
      if (action === 'signUp') {
        return "We couldn't reach the sign-up service. Check your internet connection and try again.";
      }
      if (action === 'verification' || action === 'resendVerification') {
        return "We couldn't reach the email service. Check your internet connection and try again.";
      }
      if (action === 'passwordReset') {
        return "We couldn't reach the password reset service. Check your internet connection and try again.";
      }
      if (action === 'googleSignIn') {
        return "We couldn't reach Google sign-in. Check your internet connection and try again.";
      }
      return "We couldn't reach the sign-in service. Check your internet connection and try again.";
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently unavailable. Please try another sign-in option or contact support.';
    default:
      if (action === 'signUp') {
        return "We couldn't create your account right now. Please try again later. If the problem continues, contact support.";
      }
      if (action === 'verification') {
        return "Your account was created, but we couldn't send the verification email. Try signing in later and choose “Resend verification email” when prompted.";
      }
      if (action === 'resendVerification') {
        return "We couldn't resend the verification email. Please try again later.";
      }
      if (action === 'passwordReset') {
        return "We couldn't send the password reset email. Check your connection and try again.";
      }
      if (action === 'googleSignIn') {
        return "We couldn't sign you in with Google. Please try again or use your email and password.";
      }
      return "We couldn't sign you in right now. Please try again later.";
  }
};
