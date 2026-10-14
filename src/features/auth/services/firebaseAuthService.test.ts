const mockCalls = [];
const mockStore = { signInUser: null, signUpUser: null, setDocError: null, sendError: null, signInError: null };

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(async () => {
    mockCalls.push('signIn');
    if (mockStore.signInError) throw mockStore.signInError;
    return { user: mockStore.signInUser };
  }),
  createUserWithEmailAndPassword: jest.fn(async () => {
    mockCalls.push('createUser');
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

import firebaseAuthService from './firebaseAuthService';

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
      'An error occurred. Please try again later.'
    );
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'sendVerification', 'signOut']);
  });

  it('still signs out when the profile write fails', async () => {
    mockStore.setDocError = new Error('denied');
    await expect(firebaseAuthService.signUpWithEmailAndPassword('a@b.co', 'pw')).rejects.toThrow();
    expect(mockCalls).toEqual(['createUser', 'setDoc', 'signOut']);
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
      'Too many login attempts. Please try again later.'
    );
    expect(mockCalls).toEqual(['signIn', 'sendVerification', 'signOut']);
  });

  it('maps bad credentials to a readable message', async () => {
    mockStore.signInError = Object.assign(new Error('x'), { code: 'auth/invalid-credential' });
    await expect(firebaseAuthService.resendVerificationEmail('a@b.co', 'bad')).rejects.toThrow(
      'Invalid email or password.'
    );
    expect(mockCalls).toEqual(['signIn']);
  });
});
