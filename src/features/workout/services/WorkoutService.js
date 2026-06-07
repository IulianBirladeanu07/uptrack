import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSetsFromLastWorkout } from '../handlers/WorkoutHandler';

class WorkoutService {
    constructor() {
        this.listeners = [];
        this.exerciseData = [];
        this.batchingUpdates = false;
        this.workoutStartTime = null;
        this.workoutNote = '';
        this.lastSetCache = new Map();
        this._persistTimeout = null;
        this._notifyTimeout = null;
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
        this.schedulePersist();
    }

    notifyListenersThrottled() {
        if (this._notifyTimeout) return;
        this._notifyTimeout = setTimeout(() => {
            this._notifyTimeout = null;
            this.notifyListeners();
        }, 16);
    }

    schedulePersist() {
        if (this._persistTimeout) clearTimeout(this._persistTimeout);
        this._persistTimeout = setTimeout(() => this.persistWorkout(), 1000);
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
        if (this._persistTimeout) {
            clearTimeout(this._persistTimeout);
            this._persistTimeout = null;
        }
        if (this._notifyTimeout) {
            clearTimeout(this._notifyTimeout);
            this._notifyTimeout = null;
        }
        this.exerciseData = [];
        this.workoutStartTime = null;
        this.workoutNote = '';
        this.lastSetCache.clear();
        await AsyncStorage.removeItem('activeWorkout');
        this.notifyListeners();
    }

    setWorkoutNote(note) {
        this.workoutNote = note;
        this.schedulePersist();
    }

    getWorkoutNote() {
        return this.workoutNote;
    }

    startWorkout() {
        if (!this.workoutStartTime) {
            this.workoutStartTime = Date.now();
            this.schedulePersist();
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

    async fetchLastSets(exerciseName) {
        if (this.lastSetCache.has(exerciseName)) {
            return this.lastSetCache.get(exerciseName);
        }
        try {
            const sets = await getSetsFromLastWorkout(exerciseName);
            this.lastSetCache.set(exerciseName, sets);
            return sets;
        } catch (error) {
            console.error(`Error fetching last sets for ${exerciseName}:`, error);
            return [];
        }
    }

    async loadWorkoutFromTemplate(templateExercises) {
        if (!Array.isArray(templateExercises) || templateExercises.length === 0) return [];

        const validExercises = templateExercises.filter(e => e && e.exerciseName);
        const allLastSets = await Promise.all(
            validExercises.map(e => this.fetchLastSets(e.exerciseName))
        );

        const exercisesWithHistory = validExercises.map((ex, idx) => {
            const lastSets = allLastSets[idx];

            if (ex.sets && ex.sets.length > 0 && ex.sets[0].weight !== undefined) {
                return {
                    ...ex,
                    lastWorkoutSets: lastSets,
                    sets: ex.sets.map(set => ({
                        weight: set.weight || '',
                        reps: set.reps || '',
                        isValidated: false,
                        repsModified: false,
                    })),
                    repRange: ex.repRange || '',
                };
            }

            const numSets = parseInt(ex.numSets) || 1;
            const repRangeMatch = ex.repRange?.match(/(\d+)-(\d+)/);
            let defaultReps;

            if (repRangeMatch) {
                const minReps = parseInt(repRangeMatch[1]);
                const maxReps = parseInt(repRangeMatch[2]);
                defaultReps = Array.from({ length: numSets }, (_, i) =>
                    i === 0 ? maxReps.toString() : minReps.toString()
                );
            } else {
                defaultReps = Array(numSets).fill('');
            }

            const sets = Array.from({ length: numSets }, (_, i) => {
                const previousSet = lastSets[i];
                return {
                    weight: previousSet?.weight || '',
                    reps: previousSet?.reps || defaultReps[i] || '',
                    isValidated: false,
                    repsModified: false,
                };
            });

            return {
                ...ex,
                lastWorkoutSets: lastSets,
                sets,
                repRange: ex.repRange || '',
            };
        });

        this.exerciseData = exercisesWithHistory;
        this.notifyListeners();
        return [...this.exerciseData];
    }

    updateWeight(exerciseIndex, setIndex, value) {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
        if (value !== '') {
            if (!/^\d+\.?\d?$/.test(value)) return;
            if (parseFloat(value) > 500) return;
        }
        this.exerciseData = [...this.exerciseData];
        this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
        this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
        this.exerciseData[exerciseIndex].sets[setIndex] = {
            ...this.exerciseData[exerciseIndex].sets[setIndex],
            weight: value,
            weightModified: true,
        };
        this.notifyListenersThrottled();
    }

    updateReps(exerciseIndex, setIndex, value) {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
        if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 100)) return;
        this.exerciseData = [...this.exerciseData];
        this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
        this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
        this.exerciseData[exerciseIndex].sets[setIndex] = {
            ...this.exerciseData[exerciseIndex].sets[setIndex],
            reps: value,
            repsModified: true,
        };
        this.notifyListenersThrottled();
    }

    toggleValidation(exerciseIndex, setIndex) {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;

        const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
        const reps = String(currentSet.reps || '').trim();
        const weight = String(currentSet.weight || '').trim();

        if (currentSet.isValidated) {
            this.exerciseData = this.exerciseData.map((exercise, eIdx) => {
                if (eIdx !== exerciseIndex) return exercise;
                return {
                    ...exercise,
                    sets: exercise.sets.map((set, sIdx) => {
                        if (sIdx !== setIndex) return set;
                        return { ...set, isValidated: false };
                    }),
                };
            });
            this.notifyListeners();
            return;
        }

        if (!reps || !weight) return;

        this.exerciseData = this.exerciseData.map((exercise, eIdx) => {
            if (eIdx !== exerciseIndex) return exercise;
            return {
                ...exercise,
                sets: exercise.sets.map((set, sIdx) => {
                    if (sIdx !== setIndex) return set;
                    return { ...set, isValidated: true };
                }),
            };
        });
        this.notifyListeners();
    }

    setExerciseNote(exerciseIndex, note) {
        if (!this.exerciseData[exerciseIndex]) return;
        this.exerciseData = this.exerciseData.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, note };
        });
        this.notifyListeners();
    }

    addSet(exerciseIndex) {
        if (!this.exerciseData[exerciseIndex]) return;
        const exercise = this.exerciseData[exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet = {
            weight: lastSet?.weight || '',
            reps: lastSet?.reps || '',
            isValidated: false,
            repsModified: false,
            weightModified: false,
        };
        this.exerciseData = this.exerciseData.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, sets: [...ex.sets, newSet] };
        });
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
        this.exerciseData = this.exerciseData.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== setIndex) };
        });
        this.notifyListeners();
    }

    deleteExercise(exerciseIndex) {
        this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
        this.notifyListeners();
    }

    addExercises(exercises) {
        if (!exercises || !Array.isArray(exercises)) return;
        const currentNames = this.exerciseData.map(ex => ex.exerciseName);
        const filtered = exercises.filter(
            ex => ex && ex.exerciseName && !currentNames.includes(ex.exerciseName)
        );
        if (filtered.length > 0) {
            this.exerciseData = [...this.exerciseData, ...filtered];
            this.notifyListeners();
        }
    }

    areAllSetsValidated() {
        return this.exerciseData.length > 0 &&
            this.exerciseData.every(exercise => exercise.sets.every(set => set.isValidated));
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
            if (subscribeRef.current) subscribeRef.current();
        };
    }, [setExerciseData]);

    return workoutService;
};