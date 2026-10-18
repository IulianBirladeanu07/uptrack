import { getAuthErrorMessage } from './authErrorMessage';

describe('getAuthErrorMessage', () => {
  it.each([
    ['signIn', "We couldn't sign you in because requests are temporarily limited. Please wait a while, then try again."],
    ['signUp', "We couldn't create your account because sign-up is temporarily limited. Please wait a while before trying again. If this keeps happening, contact support."],
    ['verification', "Your account was created, but we couldn't send the verification email because requests are temporarily limited. Wait a while, then go to Login and choose “Resend verification email” when prompted."],
    ['resendVerification', "We couldn't resend the verification email because email requests are temporarily limited. Please wait a while and try again."],
    ['passwordReset', "We couldn't send a password reset email because requests are temporarily limited. Please wait a while and try again."],
  ] as const)('gives an actionable too-many-requests message for %s', (action, expected) => {
    expect(getAuthErrorMessage({ code: 'auth/too-many-requests' }, action)).toBe(expected);
  });

  it('explains that an email already has an account and suggests next steps', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' }, 'signUp')).toBe(
      'An account with this email already exists. Try signing in or resetting your password.',
    );
  });

  it('guides users to their existing provider when an email is already linked elsewhere', () => {
    expect(getAuthErrorMessage(
      { code: 'auth/account-exists-with-different-credential' },
      'appleSignIn',
    )).toBe('An account already exists with this email. Sign in using your original method.');
  });

  it('does not expose raw Firebase messages for unknown errors', () => {
    expect(getAuthErrorMessage(new Error('Firebase: Error (auth/internal-error).'), 'signIn')).toBe(
      "We couldn't sign you in right now. Please try again later.",
    );
  });

  it('gives network errors guidance for the action that failed', () => {
    expect(getAuthErrorMessage({ code: 'auth/network-request-failed' }, 'signUp')).toBe(
      "We couldn't reach the sign-up service. Check your internet connection and try again.",
    );
  });
});
