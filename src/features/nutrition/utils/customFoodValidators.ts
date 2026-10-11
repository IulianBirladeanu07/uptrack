import type { FoodFormData, FoodFormErrors } from '../../../shared/types';

type NumericField = 'calories' | 'amount' | 'carbohydrates' | 'protein' | 'fats' | 'fiber' | 'sugar' | 'saturatedFats' | 'salt';

export const validateField = (field: string, value: unknown, type?: string): string | null => {
    const parseNumber = (val: unknown): number | null => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(String(val));
        return isNaN(num) ? null : num;
    };

    const numValue = parseNumber(value);

    const isValidName = (val: string): boolean => {
        if (!val) return false;
        return /^[a-zA-Z0-9\s\-'(),&.%]+$/.test(val) && val.trim().length > 0;
    };

    const isValidBarcode = (val: unknown): boolean => {
        if (!val) return false;
        return /^[0-9]{8,14}$/.test(String(val));
    };

    switch (field) {
      case 'productName':
        if (!value || typeof value !== 'string') return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        if (!isValidName(value)) return 'Name contains invalid characters';
        return null;

      case 'calories':
        if (numValue === null) return 'Calories are required and must be a number';
        if (numValue <= 0) return 'Calories must be greater than 0';
        if (numValue > 10000) return 'Calories value seems too high';
        return null;

      case 'barcode':
        if (type === 'foodWithBarcode') {
          if (!value) return 'Barcode is required';
          if (!isValidBarcode(value)) return 'Please enter a valid barcode (8 to 14 digits)';
        }
        return null;

      case 'amount':
        if (numValue === null) return 'Serving amount is required and must be a number';
        if (numValue <= 0) return 'Serving amount must be greater than 0';
        if (numValue > 10000) return 'Serving amount seems too high';
        return null;

      case 'carbohydrates':
      case 'protein':
      case 'fats':
      case 'fiber':
      case 'sugar':
      case 'saturatedFats':
        if (value === '' || value === null || value === undefined) return null;
        if (numValue === null) return `${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`;
        if (numValue < 0) return `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative`;
        if (numValue > 1000) return `${field.charAt(0).toUpperCase() + field.slice(1)} value seems too high`;
        return null;

      case 'salt':
        if (value === '' || value === null || value === undefined) return null;
        if (numValue === null) return 'Salt must be a number';
        if (numValue < 0) return 'Salt cannot be negative';
        if (numValue > 100) return 'Salt value seems too high (use grams, not milligrams)';
        return null;

      case 'unit': {
        if (!value) return 'Unit is required';
        const validUnits: unknown[] = ['g', 'ml', 'oz', 'serving'];
        if (!validUnits.includes(value)) return 'Please select a valid unit';
        return null;
      }

      default:
        return null;
    }
};

export const validateFoodData = (foodData: FoodFormData, type?: string): { isValid: boolean; errors: FoodFormErrors } => {
    const errors: FoodFormErrors = {};
    const requiredFields: (keyof FoodFormData)[] = ['productName', 'calories', 'amount', 'unit'];

    if (type === 'foodWithBarcode') {
        requiredFields.push('barcode');
    }

    const numericFields: NumericField[] = ['calories', 'amount', 'carbohydrates', 'protein', 'fats', 'fiber', 'sugar', 'saturatedFats', 'salt'];
    const parsedData: FoodFormData = { ...foodData };
    const n = (k: NumericField): number => Number(parsedData[k]);

    numericFields.forEach(field => {
        const raw = parsedData[field];
        if (raw !== undefined && raw !== null && raw !== '') {
            const parsed = parseFloat(String(raw));
            parsedData[field] = parsed;
            if (isNaN(parsed)) {
                errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a number`;
            }
        }
    });

    for (const field of requiredFields) {
        const error = validateField(field, foodData[field], type);
        if (error) {
            errors[field] = error;
        }
    }

    const optionalFields: NumericField[] = ['carbohydrates', 'protein', 'fats', 'fiber', 'sugar', 'saturatedFats', 'salt'];
    for (const field of optionalFields) {
        if (foodData[field] !== undefined && foodData[field] !== null && foodData[field] !== '') {
            const error = validateField(field, foodData[field], type);
            if (error) {
                errors[field] = error;
            }
        }
    }

    if (!isNaN(n('carbohydrates')) && !isNaN(n('protein')) && !isNaN(n('fats')) && !isNaN(n('amount'))) {
        const macroSum = (n('carbohydrates') || 0) + (n('protein') || 0) + (n('fats') || 0);
        if (macroSum > n('amount') && parsedData.unit === 'g') {
            errors.macroNutrients = 'The sum of carbohydrates, protein, and fats exceeds the total amount';
        }
    }

    if (!isNaN(n('fiber')) && !isNaN(n('carbohydrates')) && n('fiber') > n('carbohydrates')) {
        errors.fiber = 'Fiber cannot exceed total carbohydrates';
    }

    if (!isNaN(n('sugar')) && !isNaN(n('carbohydrates')) && n('sugar') > n('carbohydrates')) {
        errors.sugar = 'Sugar cannot exceed total carbohydrates';
    }

    if (!isNaN(n('saturatedFats')) && !isNaN(n('fats')) && n('saturatedFats') > n('fats')) {
        errors.saturatedFats = 'Saturated fat cannot exceed total fat';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
