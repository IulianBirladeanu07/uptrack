import Constants from 'expo-constants';
import { logger } from '../../../shared/utils/firebaseLogger';

const { defaultFoodIconUri } = Constants.expoConfig?.extra || {};

logger.info('defaultFoodIconUri: ', defaultFoodIconUri)
export const formatFoodDataForSubmission = (foodData) => {
    const safeParseFloat = (value) => {
        if (value === undefined || value === null || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };
    const formattedData = {
        productName: (foodData.productName || '').trim(),
        calories: safeParseFloat(foodData.calories),
        carbohydrates: safeParseFloat(foodData.carbohydrates),
        fats: safeParseFloat(foodData.fats),
        protein: safeParseFloat(foodData.protein),
        fiber: safeParseFloat(foodData.fiber),
        sugar: safeParseFloat(foodData.sugar),
        salt: safeParseFloat(foodData.salt),
        saturatedFats: safeParseFloat(foodData.saturatedFats),
        quantity: safeParseFloat(foodData.amount),
        unit: foodData.unit || 'g',
        isFavorite: false,
    };
    
    if (foodData.barcode) {
        formattedData.barcode = foodData.barcode.trim();
    }
    
    return formattedData;
};

export const getInitialFoodData = () => ({
    productName: '',
    calories: '',
    carbohydrates: '',
    protein: '',
    fats: '',
    fiber: '',
    sugar: '',
    saturatedFats: '',
    salt: '',
    amount: '100',
    unit: 'g',
    barcode: '',
});

export const transformForBarcodeDB = (formattedData) => ({
    barcode_id: formattedData.barcode,
    product_name: formattedData.productName,
    calories: formattedData.calories,
    carbohydrates: formattedData.carbohydrates,
    fats: formattedData.fats,
    protein: formattedData.protein,
    fiber: formattedData.fiber,
    sugar: formattedData.sugar,
    salt: formattedData.salt,
    saturated_fats: formattedData.saturatedFats,
    serving_size_unit: formattedData.unit,
    serving_size_value: formattedData.quantity,
    image: defaultFoodIconUri,
    category: '',
    last_updated: new Date().toISOString(),
});

export const transformForCustomFood = (formattedData) => ({
    productName: formattedData.productName,
    calories: formattedData.calories,
    carbohydrates: formattedData.carbohydrates || formattedData.carbohydrates,
    fats: formattedData.fats,
    protein: formattedData.protein,
    fiber: formattedData.fiber,
    sugar: formattedData.sugar,
    salt: formattedData.salt,
    saturatedFats: formattedData.saturatedFats || formattedData.saturatedFats,
    quantity: formattedData.quantity || formattedData.amount,
    unit: formattedData.unit,
    image: defaultFoodIconUri,
    category: formattedData.category || '',
    isFavorite: formattedData.isFavorite || false,
});

export const transformBarcodeDBToFoodDetail = (barcodeData) => ({
    productName: barcodeData.product_name,
    calories: barcodeData.calories,
    carbohydrates: barcodeData.carbohydrates,
    fats: barcodeData.fats,
    protein: barcodeData.protein,
    fiber: barcodeData.fiber,
    sugar: barcodeData.sugar,
    salt: barcodeData.salt,
    saturatedFats: barcodeData.saturated_fats,
    quantity: barcodeData.serving_size_value,
    unit: barcodeData.serving_size_unit,
    image: defaultFoodIconUri,
    category: barcodeData.category || '',
    isFavorite: false,
});