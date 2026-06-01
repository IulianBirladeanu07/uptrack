import { useEffect, useState } from 'react';

class WorkoutTimer {
    startTime = null;
    interval = null;
    listeners = new Set();
    isActive = false;

    start() {
        if (this.isActive) return;
        this.startTime = Date.now();
        this.isActive = true;
        this.interval = setInterval(() => {
            const elapsed = this.getElapsed();
            this.listeners.forEach(fn => fn(elapsed));
        }, 1000);
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
        this.isActive = false;
        this.startTime = null;
        this.listeners.clear();
    }

    restore(startTime) {
        if (this.interval) clearInterval(this.interval);
        this.startTime = startTime;
        this.isActive = true;
        this.interval = setInterval(() => {
            const elapsed = this.getElapsed();
            this.listeners.forEach(fn => fn(elapsed));
        }, 1000);
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