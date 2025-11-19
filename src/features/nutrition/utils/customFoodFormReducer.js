import { validateField } from './customFoodValidators';

// Action types
export const UPDATE_FIELD = 'UPDATE_FIELD';
export const VALIDATE_FIELD = 'VALIDATE_FIELD';
export const BULK_VALIDATE = 'BULK_VALIDATE';
export const UPDATE_ALL = 'UPDATE_ALL';
export const RESET_ERRORS = 'RESET_ERRORS';

// Get initial state function
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

// Helper functions
const validateFieldAndUpdateErrors = (state, field, value, foodType) => {
    const error = validateField(field, value, foodType);
    
    // Only create a new errors object if there's an actual change
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

// Reducer function with performance optimizations
export const reducer = (state, action) => {
    switch (action.type) {
        case UPDATE_FIELD: {
            const { field, value } = action;
            
            // Check if the value has actually changed to avoid unnecessary updates
            if (state.foodData[field] === value) {
                return state;
            }
            
            // Only create new objects when necessary
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
            
            // Only validate if the field is dirty
            if (!state.isDirty[field]) {
                return state;
            }
            
            const newErrors = validateFieldAndUpdateErrors(state, field, value, foodType);
            
            // Only create a new state object if errors have changed
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
            
            // Only update state if there are changes
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
            
            // Only update fields that actually changed
            for (const [key, value] of Object.entries(data)) {
                if (state.foodData[key] !== value) {
                    newData[key] = value;
                    newIsDirty[key] = true;
                    hasChanges = true;
                }
            }
            
            // Only create a new state object if there are changes
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
            // Only create a new state if there are actually errors to clear
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