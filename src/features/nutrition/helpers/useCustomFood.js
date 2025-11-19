import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Keyboard } from 'react-native';
import { supabase } from '../../../shared/services/supabaseClient';
import { validateFoodData } from '../utils/customFoodValidators';
import { formatFoodDataForSubmission, getInitialFoodData, transformForBarcodeDB, transformForCustomFood } from '../utils/customFoodDataUtils';

export const useCustomFood = (type, navigation, remainingCalories, barcode = '', meal, selectedDate) => {
    const inputRefs = useRef({});
    const validationTimeout = useRef(null);
    
    const [formData, setFormData] = useState(() => {
        const initial = getInitialFoodData();
        if (barcode) {
            initial.barcode = barcode;
        }
        return initial;
    });
    
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState({});

    useEffect(() => {
        return () => {
            if (validationTimeout.current) {
                clearTimeout(validationTimeout.current);
            }
        };
    }, []);

    const validateField = useCallback((field, value) => {
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

    const handleFieldChange = useCallback((field, value) => {
        const processedValue = field !== 'productName' && field !== 'barcode' 
            ? value.replace(/[^\d.]/g, '')
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

    const handleAmountChange = useCallback((value) => {
        const numericValue = value.replace(/[^\d.]/g, '');
        handleFieldChange('amount', numericValue);
    }, [handleFieldChange]);

    const handleFieldFocus = useCallback((field) => {
    }, []);

    const handleSubmitEditing = useCallback((currentField, nextField) => {
        if (nextField && inputRefs.current[nextField]) {
            requestAnimationFrame(() => {
                inputRefs.current[nextField]?.focus();
            });
        }
    }, []);

    const registerInputRef = useCallback((field) => (ref) => {
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
        
        Keyboard.dismiss();
        
        try {
            const formattedData = formatFoodDataForSubmission(formData);
            const updatedRemainingCalories = remainingCalories - formattedData.calories;
            
            if (type === 'foodWithBarcode') {
                const { data: existingProduct, error: fetchError } = await supabase
                    .from('barcoded_products')
                    .select('barcode_id')
                    .eq('barcode_id', formattedData.barcode)
                    .single();
                
                if (fetchError && fetchError.code !== 'PGRST116') {
                    Alert.alert('Database Error', 'Failed to check if product exists.');
                    return;
                }
                
                if (existingProduct) {
                    Alert.alert('Product Exists', 'A product with this barcode already exists in the database.');
                    return;
                }
                
                const foodItem = transformForBarcodeDB(formattedData);
                const { error } = await supabase
                    .from('barcoded_products')
                    .insert([foodItem]);
        
                if (error) {
                    Alert.alert('Database Error', 'Failed to save food data to the database.');
                    return;
                }
                
                const foodForDetail = transformForCustomFood(formattedData);
                
                navigation.navigate('FoodDetail', { 
                    food: foodForDetail,
                    meal: meal,
                    selectedDate: selectedDate || new Date(),
                    remainingCalories: updatedRemainingCalories,
                    update: false,
                    refreshBarcodedProducts: true
                });
            } else {
                const foodForDetail = transformForCustomFood(formattedData);
                
                navigation.navigate('FoodDetail', {
                    food: foodForDetail,
                    meal: meal,
                    selectedDate: selectedDate || new Date(),
                    remainingCalories: updatedRemainingCalories,
                    update: false,
                });
            }
        } catch (error) {
            console.error('Error saving data: ', error);
            Alert.alert('System Error', 'An unexpected error occurred. Please try again later.');
        }
    }, [formData, type, remainingCalories, navigation, meal, selectedDate]);
    
    const focusFirstField = useCallback(() => {
        inputRefs.current['productName']?.focus();
    }, []);

    const updateMultipleFields = useCallback((fieldsData) => {
        setFormData(prev => ({
            ...prev,
            ...fieldsData
        }));
        
        setIsDirty(prev => ({
            ...prev,
            ...Object.keys(fieldsData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        }));
        
        setTimeout(() => {
            Object.entries(fieldsData).forEach(([field, value]) => {
                validateField(field, value);
            });
        }, 300);
    }, [validateField]);

    const changeUnit = useCallback((newUnit) => {
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