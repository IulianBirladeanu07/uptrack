import { useRef, useEffect } from 'react';

class WorkoutService {
  constructor() {
    this.listeners = [];
    this.exerciseData = [];
    this.batchingUpdates = false;
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state change - INSTANT, NO BATCHING
  notifyListeners() {
    if (this.batchingUpdates) return;
    const newData = [...this.exerciseData];
    this.listeners.forEach(listener => listener(newData));
  }

  // Batch multiple operations to prevent multiple re-renders
  batch(callback) {
    this.batchingUpdates = true;
    callback();
    this.batchingUpdates = false;
    this.notifyListeners();
  }

  // Initialize or set exercise data
  setExerciseData(data) {
    this.exerciseData = Array.isArray(data) ? [...data] : [];
    this.notifyListeners();
  }

  // Get current exercise data
  getExerciseData() {
    return [...this.exerciseData];
  }

  // Update weight for a specific set - ABSOLUTE FASTEST
  updateWeight(exerciseIndex, setIndex, value) {
    if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
    
    this.exerciseData = [...this.exerciseData];
    this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
    this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
    this.exerciseData[exerciseIndex].sets[setIndex] = { 
      ...this.exerciseData[exerciseIndex].sets[setIndex],
      weight: value 
    };
    
    this.notifyListeners();
  }

  // Update reps for a specific set - ABSOLUTE FASTEST
  updateReps(exerciseIndex, setIndex, value) {
    if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
    
    this.exerciseData = [...this.exerciseData];
    this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
    this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
    this.exerciseData[exerciseIndex].sets[setIndex] = { 
      ...this.exerciseData[exerciseIndex].sets[setIndex],
      reps: value 
    };
    
    this.notifyListeners();
  }

  // Toggle validation for a specific set
  toggleValidation(exerciseIndex, setIndex) {
    if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
    
    const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
    const reps = String(currentSet.reps || '').trim();
    
    // If already validated, allow unvalidation
    if (currentSet.isValidated) {
      const newData = this.exerciseData.map((exercise, eIdx) => {
        if (eIdx !== exerciseIndex) return exercise;
        
        return {
          ...exercise,
          sets: exercise.sets.map((set, sIdx) => {
            if (sIdx !== setIndex) return set;
            return { ...set, isValidated: false };
          })
        };
      });

      this.exerciseData = newData;
      this.notifyListeners();
      console.log('WorkoutService: Set unvalidated');
      return;
    }
    
    // Only validate if reps have actual values
    // Weight can be empty for bodyweight exercises
    if (!reps) {
      console.log('WorkoutService: Cannot validate - missing reps');
      return;
    }
    
    console.log('WorkoutService: Validating set');
    
    const newData = this.exerciseData.map((exercise, eIdx) => {
      if (eIdx !== exerciseIndex) return exercise;
      
      return {
        ...exercise,
        sets: exercise.sets.map((set, sIdx) => {
          if (sIdx !== setIndex) return set;
          return { ...set, isValidated: true };
        })
      };
    });

    this.exerciseData = newData;
    this.notifyListeners();
  }

  // Add a new set to an exercise
  addSet(exerciseIndex) {
    if (!this.exerciseData[exerciseIndex]) return;
    
    const exercise = this.exerciseData[exerciseIndex];
    const repRangeMatch = exercise.repRange ? exercise.repRange.match(/(\d+)-(\d+)/) : null;
    const minReps = repRangeMatch ? parseInt(repRangeMatch[1]).toString() : '';
    
    const newSet = {
      weight: '',
      reps: minReps,
      isValidated: false,
      repsModified: false
    };

    const newData = this.exerciseData.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: [...ex.sets, newSet]
      };
    });

    this.exerciseData = newData;
    this.notifyListeners();
    console.log('WorkoutService: Added set to exercise', exerciseIndex);
  }

  // Delete a set from an exercise
  deleteSet(exerciseIndex, setIndex) {
    if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
    
    const exercise = this.exerciseData[exerciseIndex];
    
    // If only one set, remove the entire exercise
    if (exercise.sets.length <= 1) {
      this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
      this.notifyListeners();
      return;
    }
    
    // Otherwise, just remove the set
    const newData = this.exerciseData.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.filter((_, sIdx) => sIdx !== setIndex)
      };
    });

    this.exerciseData = newData;
    this.notifyListeners();
  }

  // Delete an entire exercise
  deleteExercise(exerciseIndex) {
    this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
    this.notifyListeners();
  }

  // Add new exercises
  addExercises(exercises) {
    if (!exercises || !Array.isArray(exercises)) return;
    
    const currentExerciseNames = this.exerciseData.map(ex => ex.exerciseName);
    const filteredNew = exercises.filter(
      ex => ex && ex.exerciseName && 
      !currentExerciseNames.includes(ex.exerciseName)
    );

    if (filteredNew.length > 0) {
      this.exerciseData = [...this.exerciseData, ...filteredNew];
      this.notifyListeners();
      console.log('WorkoutService: Added', filteredNew.length, 'exercises. Total:', this.exerciseData.length);
    }
  }

  // Check if all sets are validated
  areAllSetsValidated() {
    return this.exerciseData.length > 0 && 
           this.exerciseData.every(exercise => 
             exercise.sets.every(set => set.isValidated)
           );
  }

  // Reset all data
  reset() {
    this.exerciseData = [];
    this.notifyListeners();
  }

  // Reset and load new data in one operation (no visual glitch)
  resetAndLoad(data) {
    this.batch(() => {
      this.exerciseData = [];
      this.exerciseData = Array.isArray(data) ? [...data] : [];
    });
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();

// Hook for React components
export const useWorkoutService = (setExerciseData) => {
  const subscribeRef = useRef(null);

  useEffect(() => {
    // Subscribe to service updates
    subscribeRef.current = workoutService.subscribe((newData) => {
      setExerciseData(newData);
    });

    // Sync initial state
    setExerciseData(workoutService.getExerciseData());

    return () => {
      if (subscribeRef.current) {
        subscribeRef.current();
      }
    };
  }, [setExerciseData]);

  return workoutService;
};