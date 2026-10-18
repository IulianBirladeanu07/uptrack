export const VERIFICATION_EMAIL_SENDER = 'noreply@activerecovery-3a400.firebaseapp.com';

export const registrationVerificationMessage = (email: string): string =>
  `We've requested a verification email for ${email}. It may arrive from ${VERIFICATION_EMAIL_SENDER}, not an Uptrack-branded address. That's expected for this email. Delivery can take a few minutes, so check your inbox and spam/junk folder. If it hasn't arrived after a while, return to Login, enter your details, and use the resend option. You don't need to register again.`;

export const loginVerificationNotice = (email: string): string =>
  `Open the verification link sent to ${email}. The email may come from ${VERIFICATION_EMAIL_SENDER}, not an Uptrack-branded address; that's expected. Check your spam folder too.`;

export const resentVerificationMessage =
  `Check your inbox for an email from ${VERIFICATION_EMAIL_SENDER}, then open its verification link and log in.`;
