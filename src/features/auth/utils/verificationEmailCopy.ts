export const registrationVerificationMessage = (email: string): string =>
  `We've requested a verification email for ${email}. Look for the message “Verify your email for Uptrack.” Delivery can take a few minutes, so check your inbox and spam/junk folder. If it hasn't arrived after a while, return to Login, enter your details, and use the resend option. You don't need to register again.`;

export const loginVerificationNotice = (email: string): string =>
  `Open the “Verify your email for Uptrack” message sent to ${email}. If you don't see it in your inbox, check your spam folder.`;

export const resentVerificationMessage =
  'Check your inbox for “Verify your email for Uptrack,” then open its verification link and log in. If it is missing, check your spam folder.';
