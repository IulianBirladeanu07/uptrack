import { getFoodSelectionIdentity } from './foodSelectionIdentity';

describe('getFoodSelectionIdentity', () => {
    it('uses an item id when present', () => {
        expect(getFoodSelectionIdentity({ id: 'food-1', productName: 'Oats' }))
            .toBe('id:food-1');
    });

    it('distinguishes same-name food entries with different nutrition data', () => {
        expect(getFoodSelectionIdentity({ productName: 'Yogurt', calories: 80 }))
            .not.toBe(getFoodSelectionIdentity({ productName: 'Yogurt', calories: 120 }));
    });

    it('returns the same fallback identity for equivalent food objects', () => {
        expect(getFoodSelectionIdentity({ productName: 'Oats', calories: 100 }))
            .toBe(getFoodSelectionIdentity({ productName: 'Oats', calories: 100 }));
    });
});
