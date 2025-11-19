import { useState, useCallback } from 'react';

/**
 * Centralized input state manager - PROPERLY triggers React re-renders
 */
export const useInputStateManager = () => {
  const [inputStates, setInputStates] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  const getInputKey = (exerciseIndex, setIndex, type) => {
    return `${type}-${exerciseIndex}-${setIndex}`;
  };

  const getInputValue = useCallback((exerciseIndex, setIndex, type) => {
    const key = getInputKey(exerciseIndex, setIndex, type);
    return inputStates[key] || '';
  }, [inputStates]);

  const setInputValue = useCallback((exerciseIndex, setIndex, type, value) => {
    const key = getInputKey(exerciseIndex, setIndex, type);
    setInputStates(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleKeyPress = useCallback((exerciseIndex, setIndex, type, key) => {
    const inputKey = getInputKey(exerciseIndex, setIndex, type);
    const currentValue = inputStates[inputKey] || '';
    let newValue = currentValue;

    if (key === 'clear') {
      newValue = '';
    } else if (key === 'backspace') {
      newValue = currentValue.slice(0, -1);
    } else if (key === '.') {
      if (type === 'weight' && !currentValue.includes('.')) {
        newValue = currentValue + key;
      } else {
        return false;
      }
    } else if (/^\d$/.test(key)) {
      newValue = currentValue + key;
    } else if (key.startsWith('+')) {
      const increment = parseInt(key.slice(1));
      const currentNum = parseFloat(currentValue) || 0;
      newValue = (currentNum + increment).toString();
    } else if (key.startsWith('set:')) {
      newValue = key.slice(4);
    }

    let isValid = false;
    if (type === 'weight') {
      if (newValue === '' || newValue === '.') {
        isValid = true;
      } else if (newValue.includes('.')) {
        const parts = newValue.split('.');
        isValid = parts[0].length <= 3 && parts[1].length <= 1;
      } else {
        isValid = newValue.length <= 3 && /^\d+$/.test(newValue);
      }
    } else if (type === 'reps') {
      isValid = newValue === '' || (newValue.length <= 2 && /^\d+$/.test(newValue));
    }

    if (isValid) {
      setInputStates(prev => ({
        ...prev,
        [inputKey]: newValue
      }));
      return true;
    }
    return false;
  }, [inputStates]);

  const focusInput = useCallback((exerciseIndex, setIndex, type) => {
    setFocusedInput({ exerciseIndex, setIndex, type });
  }, []);

  const blurInput = useCallback(() => {
    setFocusedInput(null);
  }, []);

  const initializeFromExerciseData = useCallback((exerciseData) => {
    const newStates = {};
    exerciseData.forEach((exercise, exerciseIndex) => {
      exercise.sets.forEach((set, setIndex) => {
        const weightKey = getInputKey(exerciseIndex, setIndex, 'weight');
        const repsKey = getInputKey(exerciseIndex, setIndex, 'reps');
        newStates[weightKey] = String(set.weight || '');
        newStates[repsKey] = String(set.reps || '');
      });
    });
    setInputStates(newStates);
  }, []);

  const syncToExerciseData = useCallback((exerciseData, setExerciseData) => {
    setExerciseData(prev => {
      return prev.map((exercise, exerciseIndex) => ({
        ...exercise,
        sets: exercise.sets.map((set, setIndex) => {
          const weightKey = getInputKey(exerciseIndex, setIndex, 'weight');
          const repsKey = getInputKey(exerciseIndex, setIndex, 'reps');
          return {
            ...set,
            weight: inputStates[weightKey] || '',
            reps: inputStates[repsKey] || ''
          };
        })
      }));
    });
  }, [inputStates]);

  return {
    focusedInput,
    inputStates,
    getInputValue,
    setInputValue,
    handleKeyPress,
    focusInput,
    blurInput,
    initializeFromExerciseData,
    syncToExerciseData,
  };
};