import {
  loginVerificationNotice,
  registrationVerificationMessage,
  resentVerificationMessage,
  VERIFICATION_EMAIL_SENDER,
} from './verificationEmailCopy';

describe('verification email copy', () => {
  it('clearly identifies the unexpected sender after registration', () => {
    const message = registrationVerificationMessage('person@example.com');

    expect(message).toContain('person@example.com');
    expect(message).toContain(VERIFICATION_EMAIL_SENDER);
    expect(message).toContain('not an Uptrack-branded address');
    expect(message).toContain('spam/junk folder');
    expect(message).toContain("You don't need to register again.");
  });

  it('sets sender expectations on login and after resending', () => {
    expect(loginVerificationNotice('person@example.com')).toContain(VERIFICATION_EMAIL_SENDER);
    expect(resentVerificationMessage).toContain(VERIFICATION_EMAIL_SENDER);
    expect(resentVerificationMessage).toContain('verification link');
  });
});
