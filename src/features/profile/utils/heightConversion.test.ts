import { convertCmToFtIn } from './heightConversion';

describe('convertCmToFtIn', () => {
    it('carries rounded 12 inches into the next foot', () => {
        expect(convertCmToFtIn(182)).toEqual({ feet: 6, inches: 0 });
    });

    it('returns normalized feet and inches for other heights', () => {
        expect(convertCmToFtIn(170)).toEqual({ feet: 5, inches: 7 });
    });
});
