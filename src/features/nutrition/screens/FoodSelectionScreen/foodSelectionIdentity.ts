type FoodIdentity = {
    id?: string | undefined;
    productName?: string | null | undefined;
    image?: string | null | undefined;
    unit?: string | null | undefined;
    quantity?: number | string | null | undefined;
    calories?: number | string | null | undefined;
    protein?: number | string | null | undefined;
    carbohydrates?: number | string | null | undefined;
    fats?: number | string | null | undefined;
};

export const getFoodSelectionIdentity = (food: FoodIdentity): string =>
    food.id
        ? `id:${food.id}`
        : `fields:${JSON.stringify([
            food.productName ?? '',
            food.image ?? '',
            food.unit ?? '',
            food.quantity ?? '',
            food.calories ?? '',
            food.protein ?? '',
            food.carbohydrates ?? '',
            food.fats ?? '',
        ])}`;
