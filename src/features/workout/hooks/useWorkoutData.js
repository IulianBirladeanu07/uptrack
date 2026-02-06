import { useState, useCallback, useRef } from 'react';
import { handleWeightChange as weightHandler, handleRepsChange as repsHandler, getSetsFromLastWorkout } from '../handlers/WorkoutHandler';

const updateExerciseSet = (exerciseData, exerciseIndex, setIndex, updateFn) => {
  return exerciseData.map((exercise, idx) =>
    idx === exerciseIndex
      ? { ...exercise, sets: exercise.sets.map((set, i) => (i === setIndex ? updateFn(set) : set)) }
      : exercise
  );
};

const parseRepRange = (repsStr) => {
  if (!repsStr) return null;
  const match = repsStr.match(/(\d+)(?:-(\d+))?/);
  if (!match) return null;
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  return { min, max };
};

export const useWorkoutData = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseData, setExerciseData] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isValidationPressed, setIsValidationPressed] = useState(false);

  const memoizedHandleWeightChange = useCallback(
    (value, exerciseIndex, setIndex) => {
      setExerciseData(prev => weightHandler(value, exerciseIndex, setIndex, prev));
    },
    []
  );

  const memoizedHandleRepsChange = useCallback(
    (value, exerciseIndex, setIndex) => {
      setExerciseData(prev => repsHandler(value, exerciseIndex, setIndex, prev));
    },
    []
  );

  const memoizedHandleValidation = useCallback(
    (exerciseIndex, setIndex) => {
      
      setExerciseData(prev => {
        if (!prev[exerciseIndex] || !prev[exerciseIndex].sets[setIndex]) {
          console.error('Invalid indices:', { exerciseIndex, setIndex });
          return prev;
        }
        
        const currentSet = prev[exerciseIndex].sets[setIndex];
        const weight = String(currentSet.weight || '').trim();
        const reps = String(currentSet.reps || '').trim();

        if (currentSet.isValidated) {
          return prev.map((exercise, idx) =>
            idx === exerciseIndex
              ? {
                  ...exercise,
                  sets: exercise.sets.map((set, i) =>
                    i === setIndex ? { ...set, isValidated: false } : set
                  )
                }
              : exercise
          );
        }
        
        if (!weight || !reps) {
          console.log('Cannot validate - missing weight or reps');
          return prev;
        }
                
        const updatedData = prev.map((exercise, idx) =>
          idx === exerciseIndex
            ? {
                ...exercise,
                sets: exercise.sets.map((set, i) =>
                  i === setIndex ? { ...set, isValidated: true } : set
                )
              }
            : exercise
        );
        
        const allSetsValidated = updatedData.every(exercise =>
          exercise.sets.every(set => set.isValidated)
        );
        setIsValidationPressed(allSetsValidated);
        
        return updatedData;
      });
    },
    []
  );

  const handleSwipeDelete = useCallback((exerciseIndex, setIndex) => {
    setExerciseData(prev => {
      if (prev[exerciseIndex]?.sets?.length > 1) {
        return updateExerciseSet(prev, exerciseIndex, setIndex, () => undefined)
          .map(ex => ({
            ...ex,
            sets: ex.sets.filter(Boolean)
          }))
          .filter(ex => ex.sets.length > 0);
      } else {
        return prev.filter((_, i) => i !== exerciseIndex);
      }
    });
  }, []);

  const addNewExercisesFromRoute = useCallback(
    async (exercises) => {
      if (!exercises || !Array.isArray(exercises)) return;
      
      try {
        const setsPromises = exercises.map(exercise => getSetsFromLastWorkout(exercise.name));
        const setsResults = await Promise.all(setsPromises);
        
        const newExercises = exercises
          .filter(ex => ex && ex.name && !exerciseData.some(existing => existing.exerciseName === ex.name))
          .map((ex, index) => ({
            exerciseName: ex.name,
            imageURL: ex.imageURL || '',
            sets: [{ weight: '', reps: '', isValidated: false }],
            lastWorkoutSets: setsResults[index] || [],
          }));

        if (newExercises.length > 0) {
          setExerciseData(prev => [...prev, ...newExercises].filter(ex => ex && ex.exerciseName));
          if (!selectedExercise) setSelectedExercise(newExercises[0]?.exerciseName || null);
        }
      } catch (error) {
        console.error('Error fetching last workout sets:', error);
        const newExercises = exercises
          .filter(ex => ex && ex.name && !exerciseData.some(existing => existing.exerciseName === ex.name))
          .map(ex => ({
            exerciseName: ex.name,
            imageURL: ex.imageURL || '',
            sets: [{ weight: '', reps: '', isValidated: false }],
            lastWorkoutSets: [],
          }));

        if (newExercises.length > 0) {
          setExerciseData(prev => [...prev, ...newExercises].filter(ex => ex && ex.exerciseName));
          if (!selectedExercise) setSelectedExercise(newExercises[0]?.exerciseName || null);
        }
      }
    },
    [exerciseData, selectedExercise]
  );

  const handleSelectedWorkout = useCallback(
    async ({ note, exercises }) => {
      if (!exercises || !Array.isArray(exercises)) return;
      setInputText(note || '');
      
      try {
        const setsPromises = exercises.map(ex => ex?.exerciseName ? getSetsFromLastWorkout(ex.exerciseName) : Promise.resolve([]));
        const lastWorkoutSetsResults = await Promise.all(setsPromises);
        
        const exercisesWithLastSets = exercises
          .filter(ex => ex && ex.exerciseName)
          .map((ex, index) => {
            const numSets = parseInt(ex.numSets) || 1;
            const repRange = parseRepRange(ex.repRange);
            
            const processedSets = Array.from({ length: numSets }, (_, setIdx) => {
              let repsValue = '';
              
              if (repRange) {
                repsValue = String(setIdx === 0 ? repRange.max : repRange.min);
              }
              
              return {
                weight: '',
                reps: repsValue,
                isValidated: false
              };
            });

            return {
              exerciseName: ex.exerciseName,
              imageURL: ex.imageURL || '',
              category: ex.category,
              muscleGroup: ex.muscleGroup,
              lastWorkoutSets: lastWorkoutSetsResults[index] || [],
              sets: processedSets,
            };
          });
        
        setExerciseData(exercisesWithLastSets);
        setSelectedExercise(exercisesWithLastSets[0]?.exerciseName || null);
        setIsValidationPressed(false);
      } catch (error) {
        console.error('Error fetching last workout sets:', error.message);
        
        const exercisesBasic = exercises
          .filter(ex => ex && ex.exerciseName)
          .map(ex => {
            const numSets = parseInt(ex.numSets) || 1;
            const repRange = parseRepRange(ex.repRange);
            
            const processedSets = Array.from({ length: numSets }, (_, setIdx) => {
              let repsValue = '';
              
              if (repRange) {
                repsValue = String(setIdx === 0 ? repRange.max : repRange.min);
              }
              
              return {
                weight: '',
                reps: repsValue,
                isValidated: false
              };
            });

            return {
              exerciseName: ex.exerciseName,
              imageURL: ex.imageURL || '',
              category: ex.category,
              muscleGroup: ex.muscleGroup,
              lastWorkoutSets: [],
              sets: processedSets,
            };
          });
        
        setExerciseData(exercisesBasic);
        setSelectedExercise(exercisesBasic[0]?.exerciseName || null);
        setIsValidationPressed(false);
      }
    },
    []
  );

  return {
    selectedExercise,
    setSelectedExercise,
    exerciseData,
    setExerciseData,
    inputText,
    setInputText,
    isValidationPressed,
    setIsValidationPressed,
    memoizedHandleWeightChange,
    memoizedHandleRepsChange,
    memoizedHandleValidation,
    handleSwipeDelete,
    addNewExercisesFromRoute,
    handleSelectedWorkout,
  };
};