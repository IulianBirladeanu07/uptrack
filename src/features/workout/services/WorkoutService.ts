import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSetsFromLastWorkout } from '../handlers/WorkoutHandler';
import { isSameExercise } from '../utils/exerciseIdentity';
import { isValidWorkoutSetInput } from '../utils/workoutSetValidation';
import type { PersistedWorkoutState, WorkoutExercise, WorkoutListener, WorkoutSet } from '../types';

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createEmptySet = (): WorkoutSet => ({
    id: generateId(),
    weight: '',
    reps: '',
    isValidated: false,
    repsModified: false,
});

class WorkoutService {
    uid: string | null = null;
    userGeneration = 0;
    asyncStateGeneration = 0;
    listeners: WorkoutListener[] = [];
    exerciseData: WorkoutExercise[] = [];
    batchingUpdates = false;
    workoutStartTime: number | null = null;
    workoutNote = '';
    workoutTemplateName = '';
    lastSetCache = new Map<string, WorkoutSet[]>();
    storageQueue: Promise<void> = Promise.resolve();
    _persistTimeout: ReturnType<typeof setTimeout> | null = null;
    _notifyTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {}

    storageKey(): string | null {
        return this.uid ? `activeWorkout_${this.uid}` : null;
    }

    enqueueStorageOperation(operation: () => Promise<void>): Promise<void> {
        const operationPromise = this.storageQueue.then(operation);
        this.storageQueue = operationPromise.then(() => undefined, () => undefined);
        return operationPromise;
    }

    async setUser(uid: string | null | undefined): Promise<void> {
        const next = uid || null;
        if (next === this.uid) return;
        this.userGeneration++;
        this.asyncStateGeneration++;

        let flush = null;
        if (this._persistTimeout) {
            clearTimeout(this._persistTimeout);
            this._persistTimeout = null;
            flush = this.persistWorkout();
        }
        if (this._notifyTimeout) {
            clearTimeout(this._notifyTimeout);
            this._notifyTimeout = null;
        }

        this.uid = next;
        this.exerciseData = [];
        this.workoutStartTime = null;
        this.workoutNote = '';
        this.workoutTemplateName = '';
        this.lastSetCache.clear();
        this.listeners.forEach(listener => listener([]));

        try {
            await flush;
            await AsyncStorage.removeItem('activeWorkout');
        } catch (error) {
            console.error('Failed to switch workout user:', error);
        }
    }

    subscribe(listener: WorkoutListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners(): void {
        if (this.batchingUpdates) return;
        const newData = [...this.exerciseData];
        this.listeners.forEach(listener => listener(newData));
        this.schedulePersist();
    }

    notifyListenersThrottled(): void {
        if (this._notifyTimeout) return;
        this._notifyTimeout = setTimeout(() => {
            this._notifyTimeout = null;
            this.notifyListeners();
        }, 16);
    }

    schedulePersist(): void {
        if (this._persistTimeout) clearTimeout(this._persistTimeout);
        this._persistTimeout = setTimeout(() => {
            this.persistWorkout().catch(error => {
                console.error('Failed to persist active workout:', error);
            });
        }, 1000);
    }

    batch(callback: () => void): void {
        this.batchingUpdates = true;
        try {
            callback();
        } finally {
            this.batchingUpdates = false;
        }
        this.notifyListeners();
    }

    async persistWorkout(): Promise<void> {
        const key = this.storageKey();
        if (!key) return;
        if (this.exerciseData.length === 0) {
            await this.enqueueStorageOperation(() => AsyncStorage.removeItem(key));
            return;
        }
        const workoutState = {
            startTime: this.workoutStartTime || Date.now(),
            exercises: this.exerciseData,
            note: this.workoutNote,
            templateName: this.workoutTemplateName || '',
            isActive: true,
            lastSaved: Date.now(),
        };
        const serializedState = JSON.stringify(workoutState);
        await this.enqueueStorageOperation(() => AsyncStorage.setItem(key, serializedState));
    }

    async restoreWorkout(): Promise<PersistedWorkoutState | null> {
        const key = this.storageKey();
        if (!key) return null;
        const userGeneration = this.userGeneration;
        const asyncStateGeneration = this.asyncStateGeneration;
        try {
            const saved = await AsyncStorage.getItem(key);
            if (
                !saved ||
                userGeneration !== this.userGeneration ||
                asyncStateGeneration !== this.asyncStateGeneration ||
                key !== this.storageKey()
            ) return null;
            const state = JSON.parse(saved) as PersistedWorkoutState;
            if (state.isActive) {
                this.exerciseData = (state.exercises || []).map(ex => ({
                    ...ex,
                    sets: (ex.sets || []).map(set => (set.id ? set : { ...set, id: generateId() })),
                }));
                this.workoutStartTime = state.startTime;
                this.workoutNote = state.note || '';
                this.workoutTemplateName = state.templateName || '';
                this.notifyListeners();
                return state;
            }
        } catch (error) {
            console.error('Failed to restore workout:', error);
        }
        return null;
    }

    async clearWorkout(): Promise<void> {
        this.asyncStateGeneration++;
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
        this.workoutTemplateName = '';
        this.lastSetCache.clear();
        const key = this.storageKey();
        if (key) await this.enqueueStorageOperation(() => AsyncStorage.removeItem(key));
        this.notifyListeners();
    }

    setWorkoutNote(note: string): void {
        this.workoutNote = note;
        this.schedulePersist();
    }

    getWorkoutNote(): string {
        return this.workoutNote;
    }

    setWorkoutTemplateName(name: string): void {
        this.workoutTemplateName = name || '';
        this.schedulePersist();
    }

    getWorkoutTemplateName(): string {
        return this.workoutTemplateName;
    }

    startWorkout(): void {
        if (!this.workoutStartTime) {
            this.asyncStateGeneration++;
            this.workoutStartTime = Date.now();
            this.schedulePersist();
        }
    }

    getStartTime(): number | null {
        return this.workoutStartTime;
    }

    setExerciseData(data: WorkoutExercise[]): void {
        this.exerciseData = Array.isArray(data) ? [...data] : [];
        this.notifyListeners();
    }

    getExerciseData(): WorkoutExercise[] {
        return [...this.exerciseData];
    }

    async fetchLastSets(exerciseName: string, muscleGroup?: string): Promise<WorkoutSet[]> {
        const cacheKey = JSON.stringify([exerciseName, muscleGroup || '']);
        if (this.lastSetCache.has(cacheKey)) {
            return this.lastSetCache.get(cacheKey) ?? [];
        }
        const userGeneration = this.userGeneration;
        try {
            const sets = await getSetsFromLastWorkout(exerciseName, muscleGroup);
            if (userGeneration !== this.userGeneration) return [];
            const typed = (sets || []) as WorkoutSet[];
            this.lastSetCache.set(cacheKey, typed);
            return typed;
        } catch (error) {
            console.error(`Error fetching last sets for ${exerciseName}:`, error);
            return [] as WorkoutSet[];
        }
    }

    async loadWorkoutFromTemplate(templateExercises: WorkoutExercise[]): Promise<WorkoutExercise[]> {
        if (!Array.isArray(templateExercises) || templateExercises.length === 0) return [];

        const userGeneration = this.userGeneration;
        const asyncStateGeneration = ++this.asyncStateGeneration;
        const validExercises = templateExercises.filter(e => e && e.exerciseName);
        const allLastSets = await Promise.all(
            validExercises.map(e => this.fetchLastSets(e.exerciseName, e.muscleGroup))
        );
        if (
            userGeneration !== this.userGeneration ||
            asyncStateGeneration !== this.asyncStateGeneration
        ) return [];

        const exercisesWithHistory = validExercises.map((ex, idx) => {
            const lastSets = allLastSets[idx];

            if (ex.sets && ex.sets.length > 0 && ex.sets[0].weight !== undefined) {
                return {
                    ...ex,
                    lastWorkoutSets: lastSets,
                    sets: ex.sets.map(set => ({
                        id: generateId(),
                        weight: set.weight ?? '',
                        reps: set.reps ?? '',
                        isValidated: false,
                        repsModified: false,
                    })),
                    repRange: ex.repRange || '',
                };
            }

            const numSets = parseInt(String(ex.numSets), 10) || 1;
            const repRangeMatch = ex.repRange?.match(/(\d+)-(\d+)/);
            let defaultReps;

            if (repRangeMatch) {
                const minReps = parseInt(repRangeMatch[1], 10);
                const maxReps = parseInt(repRangeMatch[2], 10);
                defaultReps = Array.from({ length: numSets }, (_, i) =>
                    i === 0 ? maxReps.toString() : minReps.toString()
                );
            } else {
                defaultReps = Array(numSets).fill('');
            }

            const sets = Array.from({ length: numSets }, (_, i) => {
                const previousSet = lastSets[i];
                return {
                    id: generateId(),
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

    updateWeight(exerciseIndex: number, setIndex: number, value: string): void {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
        if (value !== '') {
            if (!/^\d+\.?\d{0,2}$/.test(value)) return;
            if (parseFloat(value) > 500) return;
        }
        const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
        this.exerciseData = [...this.exerciseData];
        this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
        this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
        this.exerciseData[exerciseIndex].sets[setIndex] = {
            ...currentSet,
            weight: value,
            weightModified: true,
            isValidated: currentSet.weight === value ? currentSet.isValidated : false,
        };
        this.notifyListenersThrottled();
    }

    updateReps(exerciseIndex: number, setIndex: number, value: string): void {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;
        if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 100)) return;
        const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
        this.exerciseData = [...this.exerciseData];
        this.exerciseData[exerciseIndex] = { ...this.exerciseData[exerciseIndex] };
        this.exerciseData[exerciseIndex].sets = [...this.exerciseData[exerciseIndex].sets];
        this.exerciseData[exerciseIndex].sets[setIndex] = {
            ...currentSet,
            reps: value,
            repsModified: true,
            isValidated: currentSet.reps === value ? currentSet.isValidated : false,
        };
        this.notifyListenersThrottled();
    }

    toggleValidation(exerciseIndex: number, setIndex: number): void {
        if (!this.exerciseData[exerciseIndex]?.sets[setIndex]) return;

        const currentSet = this.exerciseData[exerciseIndex].sets[setIndex];
        const reps = String(currentSet.reps ?? '').trim();
        const weight = String(currentSet.weight ?? '').trim();

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

        if (!isValidWorkoutSetInput(weight, reps)) return;

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

    setExerciseNote(exerciseIndex: number, note: string): void {
        if (!this.exerciseData[exerciseIndex]) return;
        this.exerciseData = this.exerciseData.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, note };
        });
        this.notifyListeners();
    }

    addSet(exerciseIndex: number): void {
        if (!this.exerciseData[exerciseIndex]) return;
        const exercise = this.exerciseData[exerciseIndex];
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet = {
            ...createEmptySet(),
            weight: lastSet?.weight ?? '',
            reps: lastSet?.reps ?? '',
        };
        this.exerciseData = this.exerciseData.map((ex, idx) => {
            if (idx !== exerciseIndex) return ex;
            return { ...ex, sets: [...ex.sets, newSet] };
        });
        this.notifyListeners();
    }

    deleteSet(exerciseIndex: number, setIndex: number): void {
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

    deleteExercise(exerciseIndex: number): void {
        this.exerciseData = this.exerciseData.filter((_, idx) => idx !== exerciseIndex);
        this.notifyListeners();
    }

    moveExercise(exerciseIndex: number, direction: number): void {
        const newIndex = exerciseIndex + direction;
        if (!this.exerciseData[exerciseIndex] || newIndex < 0 || newIndex >= this.exerciseData.length) return;
        const updated = [...this.exerciseData];
        const [moved] = updated.splice(exerciseIndex, 1);
        updated.splice(newIndex, 0, moved);
        this.exerciseData = updated;
        this.notifyListeners();
    }

    replaceExercise(exerciseIndex: number, newExercise: WorkoutExercise): void {
        if (!this.exerciseData[exerciseIndex]) return;
        this.exerciseData = this.exerciseData.map((ex, idx) => (idx === exerciseIndex ? newExercise : ex));
        this.notifyListeners();
    }

    addExercises(exercises: WorkoutExercise[] | null | undefined): void {
        if (!exercises || !Array.isArray(exercises)) return;
        const filtered: WorkoutExercise[] = [];
        for (const exercise of exercises) {
            if (
                !exercise?.exerciseName ||
                [...this.exerciseData, ...filtered].some(existing => isSameExercise(existing, exercise))
            ) continue;
            filtered.push(exercise);
        }
        if (filtered.length > 0) {
            this.exerciseData = [...this.exerciseData, ...filtered];
            this.notifyListeners();
        }
    }

    areAllSetsValidated(): boolean {
        return this.exerciseData.length > 0 &&
            this.exerciseData.every(exercise => exercise.sets.every(set => set.isValidated));
    }

    reset(): void {
        this.exerciseData = [];
        this.notifyListeners();
    }

    resetAndLoad(data: WorkoutExercise[]): WorkoutExercise[] {
        this.exerciseData = Array.isArray(data) ? [...data] : [];
        this.notifyListeners();
        return [...this.exerciseData];
    }
}

export const workoutService = new WorkoutService();

export const useWorkoutService = (setExerciseData: (data: WorkoutExercise[]) => void): WorkoutService => {
    const subscribeRef = useRef<(() => void) | null>(null);

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