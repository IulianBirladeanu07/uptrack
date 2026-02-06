export const useExerciseInputUtils = () => {
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleAddSet = (exerciseIndex, exerciseData, setExerciseData) => {
    if (!exerciseData || !setExerciseData) {
      console.error('handleAddSet: Missing required parameters', { exerciseData: !!exerciseData, setExerciseData: !!setExerciseData });
      return;
    }

    try {
      setExerciseData(currentData => {
        if (!Array.isArray(currentData) || !currentData[exerciseIndex]) {
          console.error('handleAddSet: Invalid exercise data structure', { currentData, exerciseIndex });
          return currentData;
        }

        const updatedData = [...currentData];
        const exercise = updatedData[exerciseIndex];
        const newSet = {
          weight: '',
          reps: '',
          isValidated: false
        };
        updatedData[exerciseIndex] = {
          ...exercise,
          sets: [...exercise.sets, newSet]
        };
        return updatedData;
      });
    } catch (error) {
      console.error('handleAddSet: Error adding set', error);
    }
  };

  return { debounce, handleAddSet };
};