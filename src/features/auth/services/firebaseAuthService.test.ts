const mockCalls = [];
const mockStore = { signInUser: null, signUpUser: null, setDocError: null, sendError: null, signInError: null, signUpError: null };

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(async () => {
    mockCalls.push('signIn');
    if (mockStore.signInError) throw mockStore.signInError;
    return { user: mockStore.signInUser };
  }),
  createUserWithEmailAndPassword: jest.fn(async () => {
    mockCalls.push('createUser');
    if (mockStore.signUpError) throw mockStore.signUpError;
    return { user: mockStore.signUpUser };
  }),
  sendEmailVerification: jest.fn(async () => {
    mockCalls.push('sendVerification');
    if (mockStore.sendError) throw mockStore.sendError;
  }),
  signOut: jest.fn(async () => {
    mockCalls.push('signOut');
  }),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn(() => ({ credential: jest.fn((value) => value) })),
  signInWithCredential: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, name, id) => ({ name, id })),
  getDoc: jest.fn(async () => {
    mockCalls.push('getDoc');
    return { data: () => ({ profileSetupComplete: true }), exists: () => true };
  }),
  setDoc: jest.fn(async () => {
    mockCalls.push('setDoc');
    if (mockStore.setDocError) throw mockStore.setDocError;
  }),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'ts'),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ auth: {}, db: {} }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: {} } }));

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword as firebaseSignIn,
  signInWithCredential,
  OAuthProvider,
} from 'firebase/auth';
import { setDoc, updateDoc } from 'firebase/firestore';
import firebaseAuthService, { sendPasswordResetEmail } from './firebaseAuthService';

const passwordUser = (emailVerified) => ({
  uid: 'u1',
  emailVerified,
  providerData: [{ providerId: 'password' }],
});

beforeEach(() => {
  mockCalls.length = 0;
  mockStore.signInUser = passwordUser(true);
  mockStore.signUpUser = passwordUser(false);
  mockStore.setDocError = null;
  mockStore.sendError = null;
  mockStore.signInError = null;
  mockStore.signUpError = null;
});

describe('signInWithEmailAndPassword', () => {
  it('signs out and throws a coded error for an unverified account', async () => {
    mockStore.signInUser = passwordUser(false);
    const setAuthenticated = jest.fn();
    const setProfileSetupComplete = jest.fn();

    await expect(
      firebaseAuthService.signInWithEmailAndPassword('a@b.co', 'pw', setAuthenticated, setProfileSetupComplete)
    ).rejects.toMatchObject({ code: 'auth/email-not-verified' });

    expect(mockCalls).toEqual(['signIn', 'signOut']);
    expect(setAuthenticated).not.toHaveBeenCalled();
    expect(setProfileSetupComplete).not.toHaveBeenCalled();
  });

  it('signs in a verified account without signing out', async () => {
    const setAuthenticated = jest.fn();
    const setProfileSetupComplete = jest.fn();

    await firebaseAuthService.signInWithEmailAndPassword('a@b.co', 'pw', setAuthenticated, setProfileSetupComplete);

    expect(mockCalls).toEqual(['signIn', 'getDoc']);
    expect(setAuthenticated).toHaveBeenCalledWith(true);
    expect(setProfileSetupComplete).toHaveBeenCalledWith(true);
  });
});

describe('signUpWithEmailAndPassword', () => {
  it('writes the profile, sends the email, then signs out', async () => {
    await firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw');
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'sendVerification', 'signOut']);
  });

  it('still signs out when the verification email fails', async () => {
    mockStore.sendError = Object.assign(new Error('x'), { code: 'auth/network-request-failed' });
    await expect(firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw')).rejects.toThrow(
      "We couldn't reach the email service. Check your internet connection and try again."
    );
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'sendVerification', 'signOut']);
  });

  it('still signs out when the profile write fails', async () => {
    mockStore.setDocError = new Error('denied');
    await expect(firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw')).rejects.toThrow(
      "Your account was created, but we couldn't finish setting it up. Please contact support before trying to register again."
    );
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'signOut']);
  });

  it('explains temporary sign-up throttling without exposing the Firebase code', async () => {
    mockStore.signUpError = Object.assign(new Error('Firebase: Error (auth/too-many-requests).'), {
      code: 'auth/too-many-requests',
    });
    await expect(firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw')).rejects.toThrow(
      "We couldn't create your account because sign-up is temporarily limited. Please wait a while before trying again. If this keeps happening, contact support."
    );
    expect(mockCalls).toEqual(['createUser']);
  });

  it('explains when the account exists but Firebase throttles its verification email', async () => {
    mockStore.sendError = Object.assign(new Error('x'), { code: 'auth/too-many-requests' });
    await expect(firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw')).rejects.toThrow(
      "Your account was created, but we couldn't send the verification email because requests are temporarily limited. Wait a while, then go to Login and choose “Resend verification email” when prompted."
    );
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'sendVerification', 'signOut']);
  });
});

describe('resendVerificationEmail', () => {
  it('sends the email to an unverified account and signs out', async () => {
    mockStore.signInUser = passwordUser(false);
    await expect(firebaseAuthService.resendVerificationEmail('a@b.co', 'pw')).resolves.toBe(true);
    expect(mockCalls).toEqual(['signIn', 'sendVerification', 'signOut']);
  });

  it('leaves a verified account signed in and sends nothing', async () => {
    await expect(firebaseAuthService.resendVerificationEmail('a@b.co', 'pw')).resolves.toBe(false);
    expect(mockCalls).toEqual(['signIn']);
  });

  it('signs out even when sending fails', async () => {
    mockStore.signInUser = passwordUser(false);
    mockStore.sendError = Object.assign(new Error('x'), { code: 'auth/too-many-requests' });
    await expect(firebaseAuthService.resendVerificationEmail('a@b.co', 'pw')).rejects.toThrow(
      "We couldn't resend the verification email because email requests are temporarily limited. Please wait a while and try again."
    );
    expect(mockCalls).toEqual(['signIn', 'sendVerification', 'signOut']);
  });

  it('maps bad credentials to a readable message', async () => {
    mockStore.signInError = Object.assign(new Error('x'), { code: 'auth/invalid-credential' });
    await expect(firebaseAuthService.resendVerificationEmail('a@b.co', 'bad')).rejects.toThrow(
      'The email or password doesn’t match an account. Check your details or reset your password.'
    );
    expect(mockCalls).toEqual(['signIn']);
  });
});

describe('signInWithGoogle', () => {
  it('does not write undefined profile fields for a Google account without a photo', async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'u1', email: 'a@b.co', displayName: 'Ana', photoURL: null },
    });

    await firebaseAuthService.signInWithGoogle({ params: { id_token: 't' } }, jest.fn(), jest.fn());

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const payload = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(Object.values(payload)).not.toContain(undefined);
    expect(payload).toEqual({ displayName: 'Ana', lastLogin: 'ts' });
  });

  it('keeps the stored name and photo when Google returns none', async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'u1', email: 'a@b.co', displayName: null, photoURL: null },
    });
    const { getDoc } = jest.requireMock('firebase/firestore');
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ displayName: 'Stored', photoURL: 'https://x/y.jpg', profileSetupComplete: true }),
    });

    await firebaseAuthService.signInWithGoogle({ params: { id_token: 't' } }, jest.fn(), jest.fn());

    expect((updateDoc as jest.Mock).mock.calls[0][1]).toEqual({
      displayName: 'Stored',
      photoURL: 'https://x/y.jpg',
      lastLogin: 'ts',
    });
  });
});

describe('signInWithApple', () => {
  it('uses the Apple ID token and raw nonce, and creates a profile with the first-time name', async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: {
        uid: 'apple-user',
        email: 'person@privaterelay.appleid.com',
        displayName: null,
        photoURL: null,
      },
    });
    const setAuthenticated = jest.fn();
    const setProfileSetupComplete = jest.fn();
    const { getDoc } = jest.requireMock('firebase/firestore');
    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ profileSetupComplete: false }),
      });

    await firebaseAuthService.signInWithApple(
      'apple-id-token',
      'raw-nonce',
      {
        email: 'person@privaterelay.appleid.com',
        fullName: { givenName: 'Ana', middleName: null, familyName: 'Pop' },
      },
      setAuthenticated,
      setProfileSetupComplete,
    );

    expect(OAuthProvider).toHaveBeenCalledWith('apple.com');
    expect(signInWithCredential).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ idToken: 'apple-id-token', rawNonce: 'raw-nonce' }),
    );
    const { setDoc } = jest.requireMock('firebase/firestore');
    expect(setDoc).toHaveBeenCalledWith(
      { name: 'users', id: 'apple-user' },
      expect.objectContaining({
        email: 'person@privaterelay.appleid.com',
        displayName: 'Ana Pop',
        profileSetupComplete: false,
      }),
    );
    expect(setAuthenticated).toHaveBeenCalledWith(true);
    expect(setProfileSetupComplete).toHaveBeenCalledWith(false);
  });

  it('does not replace an existing profile name with the transient Apple name', async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'u1', email: 'a@b.co', displayName: null },
    });
    const { getDoc, updateDoc } = jest.requireMock('firebase/firestore');
    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ displayName: 'Stored Name', email: 'a@b.co', profileSetupComplete: true }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ displayName: 'Stored Name', email: 'a@b.co', profileSetupComplete: true }),
      });

    await firebaseAuthService.signInWithApple(
      'apple-id-token',
      'raw-nonce',
      {
        email: 'a@b.co',
        fullName: { givenName: 'Different', middleName: null, familyName: 'Name' },
      },
      jest.fn(),
      jest.fn(),
    );

    expect(updateDoc).toHaveBeenCalledWith(
      { name: 'users', id: 'u1' },
      { lastLogin: 'ts' },
    );
  });
});

describe('email normalisation', () => {
  it('sends a trimmed address when signing in', async () => {
    await firebaseAuthService.signInWithEmailAndPassword('  a@b.co ', ' pw ', jest.fn(), jest.fn());

    expect(firebaseSignIn).toHaveBeenLastCalledWith({}, 'a@b.co', ' pw ');
  });

  it('creates the account and its profile with a trimmed address', async () => {
    await firebaseAuthService.signUpWithEmailAndPassword('a@b.co ', 'pw');

    expect(createUserWithEmailAndPassword).toHaveBeenLastCalledWith({}, 'a@b.co', 'pw');
    expect(setDoc).toHaveBeenLastCalledWith({ name: 'users', id: 'u1' }, expect.objectContaining({ email: 'a@b.co' }));
  });

  it('resends the verification email to a trimmed address', async () => {
    mockStore.signInUser = passwordUser(false);

    await firebaseAuthService.resendVerificationEmail(' a@b.co', 'pw');

    expect(firebaseSignIn).toHaveBeenLastCalledWith({}, 'a@b.co', 'pw');
  });

  it('sends the password reset to a trimmed address', async () => {
    await sendPasswordResetEmail(' a@b.co  ');

    expect(firebaseSendPasswordResetEmail).toHaveBeenLastCalledWith({}, 'a@b.co');
  });
});
