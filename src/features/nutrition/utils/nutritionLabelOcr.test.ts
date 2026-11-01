import { parseNutritionLabel } from './nutritionLabelOcr';

describe('parseNutritionLabel', () => {
  it('extracts nutrition values and the per-100 g basis', () => {
    expect(parseNutritionLabel(`Nutrition per 100 g
Energy 840 kJ / 201 kcal
Fat 8.5 g
of which saturates 2.1 g
Carbohydrate 24 g
of which sugars 4.2 g
Fibre 3 g
Protein 11 g
Salt 0.7 g`)).toEqual({
      fields: {
        calories: '201',
        fats: '8.5',
        saturatedFats: '2.1',
        carbohydrates: '24',
        sugar: '4.2',
        fiber: '3',
        protein: '11',
        salt: '0.7',
      },
      amount: '100',
      unit: 'g',
    });
  });

  it('handles labels and values split across OCR lines', () => {
    expect(parseNutritionLabel(`Calories
120
Total Fat
4 g
Carbs 18 g
Protein 6 g`)).toEqual({
      fields: {
        calories: '120',
        fats: '4',
        carbohydrates: '18',
        protein: '6',
      },
      amount: '100',
      unit: 'g',
    });
  });

  it('uses the serving size when values are stated per serving', () => {
    expect(parseNutritionLabel(`Per serving
Serving size 35 g
Calories 160
Fat 5 g
Protein 7 g`)).toMatchObject({
      fields: { calories: '160', fats: '5', protein: '7' },
      amount: '35',
      unit: 'g',
    });
  });

  it('uses a serving-size line from standard nutrition facts panels', () => {
    expect(parseNutritionLabel(`Nutrition Facts
Serving size 1 cup (240 ml)
Calories 120
Total Fat 3 g
Protein 8 g`)).toMatchObject({
      fields: { calories: '120', fats: '3', protein: '8' },
      amount: '240',
      unit: 'ml',
    });
  });

  it('handles serving sizes split across OCR lines', () => {
    expect(parseNutritionLabel(`Nutrition Facts
Serving size
1 cup (240 ml)
Calories 120
Total Fat 3 g
Protein 8 g`)).toMatchObject({
      amount: '240',
      unit: 'ml',
    });
  });

  it('keeps an unknown serving weight as a serving instead of assuming 100 g', () => {
    expect(parseNutritionLabel(`Per serving
Calories 160
Carbohydrate 24 g`)).toMatchObject({
      fields: { calories: '160', carbohydrates: '24' },
      amount: '1',
      unit: 'serving',
    });
  });

  it('converts energy in kJ and sodium into app-supported units', () => {
    expect(parseNutritionLabel(`Energy 840 kJ
Sodium 200 mg
Protein 10 g`)).toMatchObject({
      fields: { calories: '201', salt: '0.5', protein: '10' },
    });
  });

  it('does not confuse saturated fat with total fat or accept unrelated text', () => {
    expect(parseNutritionLabel(`Saturated fat 3 g
Ingredients: oats, milk`)).toBeNull();
  });
});
