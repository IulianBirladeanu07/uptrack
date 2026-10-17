export type PasswordStrength = '' | 'Weak' | 'Good' | 'Strong';

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[!@#$%^&*(),.?":{}|<>]/.test(password);

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return '';
  if (isStrongPassword(password)) return 'Strong';
  if (password.length >= 6) return 'Good';
  return 'Weak';
};
