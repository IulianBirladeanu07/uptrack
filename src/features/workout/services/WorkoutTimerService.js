import { useEffect, useState, useCallback } from 'react';

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
    if (this.isActive) {
      callback(this.getElapsed());
    }
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
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${secs < 10 ? '0' + secs : secs}`;
    }
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
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
  const [elapsed, setElapsed] = useState(0);
  const [formattedTime, setFormattedTime] = useState('0:00');

  useEffect(() => {
    const unsubscribe = workoutTimer.subscribe((seconds) => {
      setElapsed(seconds);
      setFormattedTime(workoutTimer.getFormattedTime());
    });

    return unsubscribe;
  }, []);

  return { elapsed, formattedTime };
}

export default workoutTimer;