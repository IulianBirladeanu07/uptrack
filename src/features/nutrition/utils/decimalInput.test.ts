import { normalizeDecimalSeparator, sanitizeDecimalInput } from './decimalInput';

describe('normalizeDecimalSeparator', () => {
    test('turns a decimal comma into a point', () => {
        expect(normalizeDecimalSeparator('1,5')).toBe('1.5');
        expect(normalizeDecimalSeparator('12,25')).toBe('12.25');
    });

    test('leaves text without commas unchanged', () => {
        expect(normalizeDecimalSeparator('1.5')).toBe('1.5');
        expect(normalizeDecimalSeparator('')).toBe('');
    });
});

describe('sanitizeDecimalInput', () => {
    test('keeps the digits of a comma decimal instead of joining them', () => {
        expect(sanitizeDecimalInput('12,5')).toBe('12.5');
        expect(sanitizeDecimalInput('1,25g')).toBe('1.25');
    });

    test('drops other characters', () => {
        expect(sanitizeDecimalInput('2a00.5 kcal')).toBe('200.5');
        expect(sanitizeDecimalInput('-3')).toBe('3');
    });
});
