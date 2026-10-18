import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Keyboard } from 'react-native';
import type { View } from 'react-native';
import { supabase } from '../../../shared/services/supabaseClient';
import { invalidateBarcodeProduct } from '../services/barcodeProductService';
import { validateFoodData } from '../utils/customFoodValidators';
import { formatDate } from '../utils/dateUtils';
import { formatFoodDataForSubmission, getInitialFoodData, passesBarcodedProductsInsertPolicy, transformForBarcodeDB, transformForCustomFood } from '../utils/customFoodDataUtils';
import { sanitizeDecimalInput } from '../utils/decimalInput';
import type { AppNavigationProp } from '../../../shared/navigation';
import type { FoodFormData, FoodFormErrors } from '../../../shared/types';

export type FieldHandle = {
    focus: () => void;
    measure: View['measure'];
};

const BARCODE_EXISTS_MESSAGE = 'A product with this barcode already exists in the database.';
const UNIQUE_VIOLATION = '23505';

type Field = keyof FoodFormData;
type FieldValue = FoodFormData[Field];

export const useCustomFood = (
    type: string | undefined,
    navigation: AppNavigationProp,
    remainingCalories: number,
    barcode = '',
    meal: string | undefined,
    selectedDate: string | undefined
) => {
    const inputRefs = useRef<Record<string, FieldHandle | null>>({});
    const validationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittingRef = useRef(false);
    
    const [formData, setFormData] = useState<FoodFormData>(() => {
        const initial: FoodFormData = getInitialFoodData();
        if (barcode) {
            initial.barcode = barcode;
        }
        return initial;
    });
    
    const [errors, setErrors] = useState<FoodFormErrors>({});
    const [isDirty, setIsDirty] = useState<Partial<Record<Field, boolean>>>({});

    useEffect(() => {
        return () => {
            if (validationTimeout.current) {
                clearTimeout(validationTimeout.current);
            }
        };
    }, []);

    const validateField = useCallback((field: Field, value: FieldValue) => {
        if (validationTimeout.current) {
            clearTimeout(validationTimeout.current);
        }
        
        validationTimeout.current = setTimeout(() => {
            const validation = validateFoodData({ [field]: value }, type);
            const fieldError = validation.errors?.[field];
            
            setErrors(prev => ({
                ...prev,
                [field]: fieldError || ''
            }));
        }, 300);
    }, [type]);

    const handleFieldChange = useCallback((field: Field, value: string) => {
        const processedValue = field !== 'productName' && field !== 'barcode' 
            ? sanitizeDecimalInput(value)
            : value;
        
        setFormData(prev => ({
            ...prev,
            [field]: processedValue
        }));
        
        setIsDirty(prev => ({
            ...prev,
            [field]: true
        }));
        
        validateField(field, processedValue);
    }, [validateField]);

    const handleAmountChange = useCallback((value: string) => {
        handleFieldChange('amount', sanitizeDecimalInput(value));
    }, [handleFieldChange]);

    const handleFieldFocus = useCallback((_field: Field) => {
    }, []);

    const handleSubmitEditing = useCallback((_currentField: Field, nextField?: Field) => {
        if (nextField && inputRefs.current[nextField]) {
            requestAnimationFrame(() => {
                inputRefs.current[nextField]?.focus();
            });
        }
    }, []);

    const registerInputRef = useCallback((field: Field) => (ref: FieldHandle | null) => {
        inputRefs.current[field] = ref;
    }, []);

    const handleSubmit = useCallback(async () => {
        const validation = validateFoodData(formData, type);
        
        if (!validation.isValid) {
            setErrors(validation.errors);
            const firstError = Object.values(validation.errors)[0];
            Alert.alert('Validation Error', firstError);
            return;
        }
        
        if (submittingRef.current) return;
        submittingRef.current = true;

        Keyboard.dismiss();
        
        try {
            const formattedData = formatFoodDataForSubmission(formData);
            const updatedRemainingCalories = remainingCalories - formattedData.calories;
            const serializedDate = selectedDate ? formatDate(selectedDate) : formatDate(new Date());
            
            if (type === 'foodWithBarcode') {
                const barcodeId = formattedData.barcode;
                if (!barcodeId) {
                    Alert.alert('Invalid product', 'Barcode or nutrition values do not meet the database rules.');
                    return;
                }

                const { data: existingProduct, error: fetchError } = await supabase
                    .from('barcoded_products')
                    .select('barcode_id')
                    .eq('barcode_id', barcodeId)
                    .single();
                
                if (fetchError && fetchError.code !== 'PGRST116') {
                    Alert.alert('Database Error', 'Failed to check if product exists.');
                    return;
                }
                
                if (existingProduct) {
                    Alert.alert('Product Exists', BARCODE_EXISTS_MESSAGE);
                    return;
                }
                
                const foodItem = transformForBarcodeDB(formattedData);
                if (!passesBarcodedProductsInsertPolicy(foodItem)) {
                    Alert.alert('Invalid product', 'Barcode or nutrition values do not meet the database rules.');
                    return;
                }
                const { error } = await supabase
                    .from('barcoded_products')
                    .insert([{ ...foodItem, barcode_id: barcodeId }]);
        
                if (error) {
                    if (error.code === UNIQUE_VIOLATION) {
                        Alert.alert('Product Exists', BARCODE_EXISTS_MESSAGE);
                        return;
                    }
                    Alert.alert('Database Error', 'Failed to save food data to the database.');
                    return;
                }
                await invalidateBarcodeProduct(barcodeId);
                
                const foodForDetail = transformForCustomFood(formattedData);
                
                navigation.navigate('FoodDetail', { 
                    food: foodForDetail,
                    meal: meal,
                    selectedDate: serializedDate,
                    remainingCalories: updatedRemainingCalories,
                    update: false
                });
            } else {
                const foodForDetail = transformForCustomFood(formattedData);
                
                navigation.navigate('FoodDetail', {
                    food: foodForDetail,
                    meal: meal,
                    selectedDate: serializedDate,
                    remainingCalories: updatedRemainingCalories,
                    update: false,
                });
            }
        } catch (error) {
            console.error('Error saving data: ', error);
            Alert.alert('System Error', 'An unexpected error occurred. Please try again later.');
        } finally {
            submittingRef.current = false;
        }
    }, [formData, type, remainingCalories, navigation, meal, selectedDate]);
    
    const focusFirstField = useCallback(() => {
        inputRefs.current['productName']?.focus();
    }, []);

    const updateMultipleFields = useCallback((fieldsData: FoodFormData) => {
        setFormData(prev => ({
            ...prev,
            ...fieldsData
        }));
        
        setIsDirty(prev => ({
            ...prev,
            ...Object.keys(fieldsData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        }));
        
        setTimeout(() => {
            (Object.keys(fieldsData) as Field[]).forEach(field => {
                validateField(field, fieldsData[field]);
            });
        }, 300);
    }, [validateField]);

    const changeUnit = useCallback((newUnit: string) => {
        if (newUnit === formData.unit) return;
        
        setFormData(prev => ({
            ...prev,
            unit: newUnit
        }));
        
        setIsDirty(prev => ({
            ...prev,
            unit: true
        }));
    }, [formData.unit]);

    const resetForm = useCallback(() => {
        setFormData(getInitialFoodData());
        setErrors({});
        setIsDirty({});
    }, []);

    return {
        foodData: formData,
        errors,
        isDirty,
        inputRefs: inputRefs.current,
        handleFieldChange,
        handleFieldFocus,
        handleSubmitEditing,
        handleAmountChange,
        registerInputRef,
        handleSubmit,
        focusFirstField,
        updateMultipleFields,
        changeUnit,
        resetForm
    };
};