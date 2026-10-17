import { getPasswordStrength, isStrongPassword, isValidEmail } from './credentials';

describe('credential validation', () => {
  describe('isValidEmail', () => {
    it.each([
      ['person@example.com', true],
      ['first.last+tag@example.co.uk', true],
      ['', false],
      ['person.example.com', false],
      ['person@', false],
      ['@example.com', false],
      ['person @example.com', false],
    ])('validates %s as %s', (email, expected) => {
      expect(isValidEmail(email)).toBe(expected);
    });
  });

  describe('isStrongPassword', () => {
    it.each([
      ['Abcdef1!', true],
      ['Ab1!', false],
      ['abcdef1!', false],
      ['ABCDEF1!', false],
      ['Abcdefgh!', false],
      ['Abcdef12', false],
    ])('validates password strength', (password, expected) => {
      expect(isStrongPassword(password)).toBe(expected);
    });
  });

  it('classifies password strength using the registration screen rules', () => {
    expect(getPasswordStrength('')).toBe('');
    expect(getPasswordStrength('abc')).toBe('Weak');
    expect(getPasswordStrength('abcdef')).toBe('Good');
    expect(getPasswordStrength('Abcdef1!')).toBe('Strong');
  });
});
