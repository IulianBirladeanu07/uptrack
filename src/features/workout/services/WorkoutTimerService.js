import { AppState } from 'react-native';
import { useState, useEffect } from 'react';

class WorkoutTimer {
    startTime = null;
    interval = null;
    listeners = new Set();
    isActive = false;
    _appStateSubscription = null;

    _startInterval() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            const elapsed = this.getElapsed();
            this.listeners.forEach(fn => fn(elapsed));
        }, 1000);
    }

    _setupAppState() {
        if (this._appStateSubscription) return;
        this._appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'active' && this.isActive) {
                this.listeners.forEach(fn => fn(this.getElapsed()));
                this._startInterval();
            } else if (state === 'background' && this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        });
    }

    start() {
        if (this.isActive) return;
        this.startTime = Date.now();
        this.isActive = true;
        this._startInterval();
        this._setupAppState();
    }

    restore(startTime) {
        if (this.interval) clearInterval(this.interval);
        this.startTime = startTime;
        this.isActive = true;
        this._startInterval();
        this._setupAppState();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        if (this.isActive) callback(this.getElapsed());
        return () => this.listeners.delete(callback);
    }

    getElapsed() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getFormattedTime() {
        const seconds = this.getElapsed();
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const pad = n => n < 10 ? '0' + n : n;
        if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
        return `${minutes}:${pad(secs)}`;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this._appStateSubscription) {
            this._appStateSubscription.remove();
            this._appStateSubscription = null;
        }
        this.isActive = false;
        this.startTime = null;
        this.listeners.clear();
    }
}

export const workoutTimer = new WorkoutTimer();

export function useWorkoutTimer() {
    const [formattedTime, setFormattedTime] = useState(() => workoutTimer.getFormattedTime());

    useEffect(() => {
        const unsubscribe = workoutTimer.subscribe(() => {
            setFormattedTime(workoutTimer.getFormattedTime());
        });
        return unsubscribe;
    }, []);

    return { formattedTime };
}

export default workoutTimer;