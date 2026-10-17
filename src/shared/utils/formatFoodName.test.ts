import formatFoodName from './formatFoodName';

describe('formatFoodName', () => {
  it('provides a fallback for missing names and capitalizes the first character', () => {
    expect(formatFoodName()).toBe('No Name');
    expect(formatFoodName(null)).toBe('No Name');
    expect(formatFoodName('oats')).toBe('Oats');
  });

  it('removes trailing punctuation and whitespace', () => {
    expect(formatFoodName('chicken breast,  ')).toBe('Chicken breast');
    expect(formatFoodName('rice!!!')).toBe('Rice');
  });

  it('truncates at the last word boundary when it is sufficiently late', () => {
    const boundary = 'a'.repeat(25);
    const formatted = formatFoodName(`${boundary} food${'x'.repeat(30)}`);
    expect(formatted).toBe(`A${'a'.repeat(24)}`);
  });

  it('uses a hard length limit when there is no late word boundary', () => {
    const formatted = formatFoodName('a'.repeat(100));
    expect(formatted).toHaveLength(35);
  });
});
