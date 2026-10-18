import {
  loginVerificationNotice,
  registrationVerificationMessage,
  resentVerificationMessage,
} from './verificationEmailCopy';

describe('verification email copy', () => {
  it('identifies the expected Uptrack message and explains recovery after registration', () => {
    const message = registrationVerificationMessage('person@example.com');

    expect(message).toContain('person@example.com');
    expect(message).toContain('Verify your email for Uptrack');
    expect(message).not.toMatch(/activerecovery|firebaseapp|not an Uptrack-branded address/i);
    expect(message).toContain('spam/junk folder');
    expect(message).toContain("You don't need to register again.");
  });

  it('sets sender expectations on login and after resending', () => {
    expect(loginVerificationNotice('person@example.com')).toContain('Verify your email for Uptrack');
    expect(loginVerificationNotice('person@example.com')).not.toMatch(/activerecovery|firebaseapp/i);
    expect(resentVerificationMessage).toContain('Verify your email for Uptrack');
    expect(resentVerificationMessage).toContain('verification link');
  });
});
