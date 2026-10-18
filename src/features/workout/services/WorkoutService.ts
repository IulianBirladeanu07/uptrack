import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSetsFromLastWorkout } from './workoutHistoryService';
import { buildWorkoutFromTemplate } from './buildWorkoutFromTemplate';
import {
    addWorkoutExercises,
    addWorkoutSet,
    areAllWorkoutSetsValidated,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    moveWorkoutExercise,
    replaceWorkoutExercise,
    toggleWorkoutSetValidation,
    updateWorkoutExerciseNote,
    updateWorkoutReps,
    updateWorkoutWeight,
} from './workoutExerciseUpdates';
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
        this.asyncStateGeneration++;
        if (this._notifyTimeout) return;
        this._notifyTimeout = setTimeout(() => {
            this._notifyTimeout = null;
            this.notifyListeners();
        }, 16);
    }

    schedulePersist(): void {
        this.asyncStateGeneration++;
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

        this.exerciseData = buildWorkoutFromTemplate(validExercises, allLastSets, generateId);
        this.notifyListeners();
        return [...this.exerciseData];
    }

    updateWeight(exerciseIndex: number, setIndex: number, value: string): void {
        const updated = updateWorkoutWeight(this.exerciseData, exerciseIndex, setIndex, value);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListenersThrottled();
    }

    updateReps(exerciseIndex: number, setIndex: number, value: string): void {
        const updated = updateWorkoutReps(this.exerciseData, exerciseIndex, setIndex, value);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListenersThrottled();
    }

    toggleValidation(exerciseIndex: number, setIndex: number): void {
        const updated = toggleWorkoutSetValidation(this.exerciseData, exerciseIndex, setIndex);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    setExerciseNote(exerciseIndex: number, note: string): void {
        const updated = updateWorkoutExerciseNote(this.exerciseData, exerciseIndex, note);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    addSet(exerciseIndex: number): void {
        const updated = addWorkoutSet(this.exerciseData, exerciseIndex, createEmptySet);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    deleteSet(exerciseIndex: number, setIndex: number): void {
        const updated = deleteWorkoutSet(this.exerciseData, exerciseIndex, setIndex);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    deleteExercise(exerciseIndex: number): void {
        this.exerciseData = deleteWorkoutExercise(this.exerciseData, exerciseIndex);
        this.notifyListeners();
    }

    moveExercise(exerciseIndex: number, direction: number): void {
        const updated = moveWorkoutExercise(this.exerciseData, exerciseIndex, direction);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    replaceExercise(exerciseIndex: number, newExercise: WorkoutExercise): void {
        const updated = replaceWorkoutExercise(this.exerciseData, exerciseIndex, newExercise);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    addExercises(exercises: WorkoutExercise[] | null | undefined): void {
        const updated = addWorkoutExercises(this.exerciseData, exercises);
        if (!updated) return;
        this.exerciseData = updated;
        this.notifyListeners();
    }

    areAllSetsValidated(): boolean {
        return areAllWorkoutSetsValidated(this.exerciseData);
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