import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';

const memoryCache = new Map();

export class WeightService {
    static getWeekStartDate(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    static formatDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    static getLocalWeekStartKey(date) {
        return this.formatDateKey(this.getWeekStartDate(date));
    }

    static async getUserWeightData(userId) {
        try {
            const cached = memoryCache.get(userId);
            if (cached) return cached;

            const cacheKey = `user_${userId}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);

            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const cacheTime = new Date(parsed.lastWeightUpdate || 0);
                const now = new Date();
                if (now - cacheTime < 5 * 60 * 1000) {
                    memoryCache.set(userId, parsed);
                    return parsed;
                }
            }

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
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

    static async getWeightDisplayData(userId, selectedDate = new Date()) {
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
                new Date(b.weekStart) - new Date(a.weekStart)
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