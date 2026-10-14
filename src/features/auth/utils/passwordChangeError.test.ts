import { passwordChangeError } from './passwordChangeError';

describe('passwordChangeError', () => {
  it('reports a wrong current password for both Firebase codes', () => {
    expect(passwordChangeError('auth/wrong-password')).toBe('Current password is incorrect.');
    expect(passwordChangeError('auth/invalid-credential')).toBe('Current password is incorrect.');
  });

  it('explains rate limits, network failures and weak passwords', () => {
    expect(passwordChangeError('auth/too-many-requests')).toBe('Too many attempts. Try again later.');
    expect(passwordChangeError('auth/network-request-failed')).toBe('No connection. Try again.');
    expect(passwordChangeError('auth/weak-password')).toBe('The new password is too weak.');
  });

  it('asks for a fresh login when Firebase requires one', () => {
    expect(passwordChangeError('auth/requires-recent-login')).toBe('Log in again, then retry.');
  });

  it('never leaks the raw Firebase text for unknown codes', () => {
    expect(passwordChangeError('auth/something-new')).toBe('The password was not updated. Try again.');
    expect(passwordChangeError(undefined)).toBe('The password was not updated. Try again.');
    expect(passwordChangeError(null)).toBe('The password was not updated. Try again.');
  });
});
