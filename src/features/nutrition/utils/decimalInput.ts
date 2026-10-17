export const normalizeDecimalSeparator = (text: string): string => text.replace(/,/g, '.');

export const sanitizeDecimalInput = (text: string): string =>
    normalizeDecimalSeparator(text).replace(/[^\d.]/g, '');
