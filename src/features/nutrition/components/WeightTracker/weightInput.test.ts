import { applyWeightKey } from './weightInput';

describe('applyWeightKey', () => {
    it('starts a fresh entry and adds a leading zero for a decimal point', () => {
        expect(applyWeightKey('72.5', '6', true)).toBe('6');
        expect(applyWeightKey('', '.', true)).toBe('0.');
    });

    it('accepts one decimal digit and rejects a second decimal point or fractional digit', () => {
        expect(applyWeightKey('72', '.', false)).toBe('72.');
        expect(applyWeightKey('72.', '5', false)).toBe('72.5');
        expect(applyWeightKey('72.5', '.', false)).toBeNull();
        expect(applyWeightKey('72.5', '6', false)).toBeNull();
    });

    it('limits whole-number entries to four digits', () => {
        expect(applyWeightKey('123', '4', false)).toBe('1234');
        expect(applyWeightKey('1234', '5', false)).toBeNull();
        expect(applyWeightKey('123.', '4', false)).toBe('123.4');
    });

    it('removes the last character on backspace', () => {
        expect(applyWeightKey('72.5', 'backspace', false)).toBe('72.');
        expect(applyWeightKey('', 'backspace', false)).toBe('');
    });
});
