export const validateField = (field, value, type) => {
    const parseNumber = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
    };

    const numValue = parseNumber(value);
    
    const isValidName = (val) => {
        if (!val) return false;
        return /^[a-zA-Z0-9\s\-'(),&.%]+$/.test(val) && val.trim().length > 0;
    };
    
    const isValidBarcode = (val) => {
        if (!val) return false;
        return /^[0-9]{8}$|^[0-9]{12,14}$/.test(val);
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
          if (!isValidBarcode(value)) return 'Please enter a valid barcode (8, 12, 13, or 14 digits)';
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
      case 'saturatedFat':
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
      
      case 'unit':
        if (!value) return 'Unit is required';
        const validUnits = ['g', 'ml', 'oz', 'serving'];
        if (!validUnits.includes(value)) return 'Please select a valid unit';
        return null;
        
      default:
        return null;
    }
};

export const validateFoodData = (foodData, type) => {
    const errors = {};
    const requiredFields = ['productName', 'calories', 'amount', 'unit'];
    
    if (type === 'foodWithBarcode') {
        requiredFields.push('barcode');
    }
    
    const numericFields = ['calories', 'amount', 'carbohydrates', 'protein', 'fats', 'fiber', 'sugar', 'saturatedFat', 'salt'];
    const parsedData = { ...foodData };
    
    numericFields.forEach(field => {
        if (parsedData[field] !== undefined && parsedData[field] !== null && parsedData[field] !== '') {
            parsedData[field] = parseFloat(parsedData[field]);
            if (isNaN(parsedData[field])) {
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
    
    const optionalFields = ['carbohydrates', 'protein', 'fats', 'fiber', 'sugar', 'saturatedFat', 'salt'];
    for (const field of optionalFields) {
        if (foodData[field] !== undefined && foodData[field] !== null && foodData[field] !== '') {
            const error = validateField(field, foodData[field], type);
            if (error) {
                errors[field] = error;
            }
        }
    }
    
    if (!isNaN(parsedData.carbohydrates) && !isNaN(parsedData.protein) && !isNaN(parsedData.fats) && !isNaN(parsedData.amount)) {
        const macroSum = (parsedData.carbohydrates || 0) + (parsedData.protein || 0) + (parsedData.fats || 0);
        if (macroSum > parsedData.amount && parsedData.unit === 'g') {
            errors.macroNutrients = 'The sum of carbohydrates, protein, and fats exceeds the total amount';
        }
    }
    
    if (!isNaN(parsedData.fiber) && !isNaN(parsedData.carbohydrates) && parsedData.fiber > parsedData.carbohydrates) {
        errors.fiber = 'Fiber cannot exceed total carbohydrates';
    }
    
    if (!isNaN(parsedData.sugar) && !isNaN(parsedData.carbohydrates) && parsedData.sugar > parsedData.carbohydrates) {
        errors.sugar = 'Sugar cannot exceed total carbohydrates';
    }
    
    if (!isNaN(parsedData.saturatedFat) && !isNaN(parsedData.fats) && parsedData.saturatedFat > parsedData.fats) {
        errors.saturatedFat = 'Saturated fat cannot exceed total fat';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};