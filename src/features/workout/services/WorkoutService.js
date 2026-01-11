import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WorkoutService {
  constructor() {
    this.listeners = [];
    this.exerciseData = [];
    this.batchingUpdates = false;
    this.workoutStartTime = null;
    this.workoutNote = '';
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    if (this.batchingUpdates) return;
    const newData = [...this.exerciseData];
    this.listeners.forEach(listener => listener(newData));
    this.persistWorkout();
  }

  batch(callback) {
    this.batchingUpdates = true;
    callback();
    this.batchingUpdates = false;
    this.notifyListeners();
  }

  async persistWorkout() {
    if (this.exerciseData.length === 0) {
      await AsyncStorage.removeItem('activeWorkout');
      return;
    }

    const workoutState = {
      startTime: this.workoutStartTime || Date.now(),
      exercises: this.exerciseData,
      note: this.workoutNote,
      isActive: true,
      lastSaved: Date.now(),
    };

    await AsyncStorage.setItem('activeWorkout', JSON.stringify(workoutState));
  }

  async restoreWorkout() {
    try {
      const saved = await AsyncStorage.getItem('activeWorkout');
      if (!saved) return null;

      const state = JSON.parse(saved);
      if (state.isActive) {
        this.exerciseData = state.exercises || [];
        this.workoutStartTime = state.startTime;
        this.workoutNote = state.note || '';
        this.notifyListeners();
        return state;
      }
    } catch (error) {
      console.error('Failed to restore workout:', error);
    }
    return null;
  }

  async clearWorkout() {
    this.exerciseData = [];
    this.workoutStartTime = null;
    this.workoutNote = '';
    await AsyncStorage.removeItem('activeWorkout');
    this.notifyListeners();
  }

  setWorkoutNote(note) {
    this.workoutNote = note;
    this.persistWorkout();
  }

  getWorkoutNote() {
    return this.workoutNote;
  }

  startWorkout() {
    if (!this.workoutStartTime) {
      this.workoutStartTime = Date.now();
      this.persistWorkout();
    }
  }

  getStartTime() {
    return this.workoutStartTime;
  }

  setExerciseData(data) {
    this.exerciseData = Array.isArray(data) ? [...data] : [];
    this.notifyListeners();
  }

  getExerciseData() {
    return [...this.exerciseData];
  }

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

  toggleValidation(exerciseIndex, setIndex) {
      if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
      
      const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
      const reps = String(currentSet.reps || '').trim();
      const weight = String(currentSet.weight || '').trim();
      
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
          return;
      }
      
      if (!reps || !weight) {
          return;
      }
      
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
  }

  deleteSet(exerciseIndex, setIndex) {
    if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
    
    const exercise = this.exerciseData[exerciseIndex];
    
    if (exercise.sets.length <= 1) {
      this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
      this.notifyListeners();
      return;
    }
    
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

  deleteExercise(exerciseIndex) {
    this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
    this.notifyListeners();
  }

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
    }
  }

  areAllSetsValidated() {
    return this.exerciseData.length > 0 && 
           this.exerciseData.every(exercise => 
             exercise.sets.every(set => set.isValidated)
           );
  }

  reset() {
    this.exerciseData = [];
    this.notifyListeners();
  }

  resetAndLoad(data) {
    this.exerciseData = Array.isArray(data) ? [...data] : [];
    this.notifyListeners();
    return [...this.exerciseData];
  }
}

export const workoutService = new WorkoutService();

export const useWorkoutService = (setExerciseData) => {
  const subscribeRef = useRef(null);

  useEffect(() => {
    subscribeRef.current = workoutService.subscribe((newData) => {
      setExerciseData(newData);
    });

    setExerciseData(workoutService.getExerciseData());

    return () => {
      if (subscribeRef.current) {
        subscribeRef.current();
      }
    };
  }, [setExerciseData]);

  return workoutService;
};