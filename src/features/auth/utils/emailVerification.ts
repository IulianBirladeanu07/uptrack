type VerifiableUser = {
  emailVerified: boolean;
  providerData: ReadonlyArray<{ providerId: string }>;
};

export const needsEmailVerification = (user: VerifiableUser | null | undefined): boolean =>
  !!user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password');
