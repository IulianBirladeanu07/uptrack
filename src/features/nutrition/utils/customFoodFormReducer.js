import { validateField } from './customFoodValidators';

export const UPDATE_FIELD = 'UPDATE_FIELD';
export const VALIDATE_FIELD = 'VALIDATE_FIELD';
export const BULK_VALIDATE = 'BULK_VALIDATE';
export const UPDATE_ALL = 'UPDATE_ALL';
export const RESET_ERRORS = 'RESET_ERRORS';

export const getInitialState = () => ({
    foodData: {
        productName: '',
        calories: '',
        carbohydrates: '',
        protein: '',
        fats: '',
        fiber: '',
        sugar: '',
        saturatedFat: '',
        salt: '',
        amount: '100',
        unit: 'g',
        barcode: '',
    },
    errors: {},
    isDirty: {},
});

const validateFieldAndUpdateErrors = (state, field, value, foodType) => {
    const error = validateField(field, value, foodType);
    
    if ((error && !state.errors[field]) || (!error && state.errors[field]) || 
        (error && state.errors[field] && error !== state.errors[field])) {
        const newErrors = { ...state.errors };
        
        if (error) {
            newErrors[field] = error;
        } else {
            delete newErrors[field];
        }
        
        return newErrors;
    }
    
    return state.errors;
};

export const reducer = (state, action) => {
    switch (action.type) {
        case UPDATE_FIELD: {
            const { field, value } = action;
            
            if (state.foodData[field] === value) {
                return state;
            }
            
            return {
                ...state,
                foodData: {
                    ...state.foodData,
                    [field]: value
                },
                isDirty: {
                    ...state.isDirty,
                    [field]: true
                }
            };
        }
        
        case VALIDATE_FIELD: {
            const { field, value, foodType } = action;            
            if (!state.isDirty[field]) {
                return state;
            }
            
            const newErrors = validateFieldAndUpdateErrors(state, field, value, foodType);            
            if (newErrors !== state.errors) {
                return {
                    ...state,
                    errors: newErrors
                };
            }
            
            return state;
        }
        
        case BULK_VALIDATE: {
            const { fields, foodType } = action;
            let newErrors = { ...state.errors };
            let hasChanges = false;
            
            for (const field of fields) {
                if (!state.isDirty[field]) continue;
                
                const error = validateField(field, state.foodData[field], foodType);
                
                if ((error && !state.errors[field]) || (!error && state.errors[field]) || 
                    (error && state.errors[field] && error !== state.errors[field])) {
                    if (error) {
                        newErrors[field] = error;
                    } else {
                        delete newErrors[field];
                    }
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                return {
                    ...state,
                    errors: newErrors
                };
            }
            
            return state;
        }
        
        case UPDATE_ALL: {
            const { data } = action;
            const newData = { ...state.foodData };
            const newIsDirty = { ...state.isDirty };
            let hasChanges = false;

            for (const [key, value] of Object.entries(data)) {
                if (state.foodData[key] !== value) {
                    newData[key] = value;
                    newIsDirty[key] = true;
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                return {
                    ...state,
                    foodData: newData,
                    isDirty: newIsDirty
                };
            }
            
            return state;
        }
        
        case RESET_ERRORS:
            if (Object.keys(state.errors).length > 0) {
                return {
                    ...state,
                    errors: {}
                };
            }
            return state;
            
        default:
            return state;
    }
};