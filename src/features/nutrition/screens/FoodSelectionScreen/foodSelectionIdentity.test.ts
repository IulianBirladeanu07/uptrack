import {
    getFoodSelectionIdentity,
    prepareFoodForDetail,
    upsertSelectedFood,
} from './foodSelectionIdentity';

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

    it('retains an id-less selected food identity while editing and replaces it on return', () => {
        const original = { productName: 'Yogurt', calories: 80 };
        const prepared = prepareFoodForDetail([original], original, 'selection-id');
        const edited = { ...prepared.food, calories: 120 };

        expect(prepared.food.id).toBe('selection-id');
        expect(prepared.selectedFoods).toEqual([prepared.food]);
        expect(upsertSelectedFood(prepared.selectedFoods, edited)).toEqual([edited]);
        expect(upsertSelectedFood(prepared.selectedFoods, edited)).toHaveLength(1);
    });
});
