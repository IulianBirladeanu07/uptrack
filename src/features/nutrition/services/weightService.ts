import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';
import type { DateInput, UserData, WeightDisplayData } from '../../../shared/types';

const memoryCache = new Map<string, UserData>();

export class WeightService {
    static getWeekStartDate(date: DateInput): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    static formatDateKey(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    static getLocalWeekStartKey(date: DateInput): string {
        return this.formatDateKey(this.getWeekStartDate(date));
    }

    static async invalidateCache(userId: string): Promise<void> {
        memoryCache.delete(userId);
        try {
            await AsyncStorage.removeItem(`user_${userId}`);
        } catch (error) {
            console.error('Error clearing weight cache:', error);
        }
    }

    static isFresh(data: UserData | null | undefined, maxAgeMs = 5 * 60 * 1000): boolean {
        if (!data) return false;
        const cacheTime = new Date(data.lastWeightUpdate || 0).getTime();
        if (!cacheTime) return false;
        return Date.now() - cacheTime < maxAgeMs;
    }

    static async getUserWeightData(userId: string): Promise<UserData | null> {
        try {
            const cached = memoryCache.get(userId);
            if (cached && this.isFresh(cached)) return cached;
            if (cached) memoryCache.delete(userId);

            const cacheKey = `user_${userId}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);

            if (cachedData) {
                const parsed: UserData = JSON.parse(cachedData);
                if (this.isFresh(parsed)) {
                    memoryCache.set(userId, parsed);
                    return parsed;
                }
            }

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data() as UserData;
                memoryCache.set(userId, userData);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(userData));
                return userData;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user weight data:', error);
            throw error;
        }
    }

    /** Push freshly written user data into both caches so readers see it immediately. */
    static async setCachedUserData(userId: string, userData: UserData | null | undefined): Promise<void> {
        if (!userId || !userData) return;
        memoryCache.set(userId, userData);
        try {
            await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        } catch (error) {
            console.error('Error writing weight cache:', error);
        }
    }

    static async getWeightDisplayData(userId: string, selectedDate: DateInput = new Date()): Promise<WeightDisplayData> {
        try {
            const userData = await this.getUserWeightData(userId);
            if (!userData || !userData.weightIns) {
                return {
                    currentWeight: userData?.currentWeight || null,
                    weeklyAverage: null,
                    lastWeekAverage: null,
                    weeklyTrend: null,
                    weighInCount: 0,
                };
            }

            const sortedWeeks = [...userData.weightIns].sort((a, b) =>
                new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
            );

            const weekStartDate = this.getLocalWeekStartKey(selectedDate);
            const currentIndex = sortedWeeks.findIndex(entry => entry.weekStart === weekStartDate);

            const currentWeek = currentIndex >= 0 ? sortedWeeks[currentIndex] : null;
            const lastWeek    = currentIndex >= 0 ? sortedWeeks[currentIndex + 1] : null;

            const weeklyTrend = currentWeek?.average != null && lastWeek?.average != null
                ? parseFloat((currentWeek.average - lastWeek.average).toFixed(2))
                : null;

            return {
                currentWeight: userData.currentWeight || null,
                weeklyAverage: currentWeek?.average || null,
                lastWeekAverage: lastWeek?.average || null,
                weeklyTrend,
                weighInCount: currentWeek ? Object.keys(currentWeek.days || {}).length : 0,
            };
        } catch (error) {
            console.error('Error getting weight display data:', error);
            return {
                currentWeight: null,
                weeklyAverage: null,
                lastWeekAverage: null,
                weeklyTrend: null,
                weighInCount: 0,
            };
        }
    }
}

export default WeightService;
