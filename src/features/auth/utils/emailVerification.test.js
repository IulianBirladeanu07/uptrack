import { needsEmailVerification } from './emailVerification';

const user = (emailVerified, ...providerIds) => ({
  emailVerified,
  providerData: providerIds.map(providerId => ({ providerId })),
});

describe('needsEmailVerification', () => {
  it('is true for an unverified password account', () => {
    expect(needsEmailVerification(user(false, 'password'))).toBe(true);
  });

  it('is false once the email is verified', () => {
    expect(needsEmailVerification(user(true, 'password'))).toBe(false);
  });

  it('is false for Google accounts, verified or not', () => {
    expect(needsEmailVerification(user(false, 'google.com'))).toBe(false);
    expect(needsEmailVerification(user(true, 'google.com'))).toBe(false);
  });

  it('is true when a password provider is linked beside Google and the email is unverified', () => {
    expect(needsEmailVerification(user(false, 'google.com', 'password'))).toBe(true);
  });

  it('is false without a user or providers', () => {
    expect(needsEmailVerification(null)).toBe(false);
    expect(needsEmailVerification(undefined)).toBe(false);
    expect(needsEmailVerification(user(false))).toBe(false);
  });
});
