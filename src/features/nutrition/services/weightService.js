import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../auth/services/firebaseConfigService';

const memoryCache = new Map();

export class WeightService {
    static getDayKey(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }

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

    static calculateWeeklyAverage(weeklyWeights) {
        const weights = Object.values(weeklyWeights).filter(w => w !== null && w !== undefined);
        if (weights.length === 0) return null;
        const sum = weights.reduce((acc, curr) => acc + curr, 0);
        return parseFloat((sum / weights.length).toFixed(2));
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

    static async saveWeightEntry(userId, date, weight) {
        try {
            const weekStartDate = this.getLocalWeekStartKey(date);
            const dayKey = this.getDayKey(date);

            const userData = await this.getUserWeightData(userId);
            const weightIns = Array.isArray(userData?.weightIns) ? userData.weightIns : [];

            let currentWeekIndex = weightIns.findIndex(entry => entry.weekStart === weekStartDate);
            let updatedWeightIns = [...weightIns];

            if (currentWeekIndex >= 0) {
                updatedWeightIns[currentWeekIndex] = {
                    ...updatedWeightIns[currentWeekIndex],
                    days: {
                        ...updatedWeightIns[currentWeekIndex].days,
                        [dayKey]: weight
                    },
                    lastUpdated: new Date().toISOString(),
                };
            } else {
                updatedWeightIns.push({
                    weekStart: weekStartDate,
                    days: { [dayKey]: weight },
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                });
                currentWeekIndex = updatedWeightIns.length - 1;
            }

            const currentWeekEntry = updatedWeightIns[currentWeekIndex];
            const currentWeekAverage = this.calculateWeeklyAverage(currentWeekEntry.days);
            currentWeekEntry.average = currentWeekAverage;

            updatedWeightIns.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));

            let weeklyTrend = null;
            let lastWeekAverage = null;

            if (updatedWeightIns.length >= 2) {
                const currentIndex = updatedWeightIns.findIndex(entry => entry.weekStart === weekStartDate);
                if (currentIndex > 0) {
                    const lastWeekEntry = updatedWeightIns[currentIndex - 1];
                    if (lastWeekEntry && lastWeekEntry.average && currentWeekAverage) {
                        lastWeekAverage = lastWeekEntry.average;
                        weeklyTrend = parseFloat((currentWeekAverage - lastWeekEntry.average).toFixed(2));
                    }
                }
            }

            const userDocRef = doc(db, 'users', userId);
            const updateData = {
                currentWeight: weight,
                weightIns: updatedWeightIns,
                lastWeightUpdate: new Date().toISOString(),
                weeklyTrend,
            };

            await setDoc(userDocRef, updateData, { merge: true });

            const cacheData = { ...userData, ...updateData };
            memoryCache.set(userId, cacheData);
            await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(cacheData));

            return {
                success: true,
                currentWeekAverage,
                weeklyTrend,
                lastWeekAverage,
                weightIns: updatedWeightIns,
            };
        } catch (error) {
            console.error('Error saving weight entry:', error);
            throw error;
        }
    }

    static async getWeightDisplayData(userId) {
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

            const currentWeek = sortedWeeks[0];
            const lastWeek = sortedWeeks[1];

            return {
                currentWeight: userData.currentWeight || null,
                weeklyAverage: currentWeek?.average || null,
                lastWeekAverage: lastWeek?.average || null,
                weeklyTrend: userData.weeklyTrend || null,
                weighInCount: currentWeek ? Object.keys(currentWeek.days).length : 0,
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

    static async getWeightForDate(userId, date) {
        try {
            const userData = await this.getUserWeightData(userId);
            if (!userData || !userData.weightIns) return null;

            const weekStartDate = this.getLocalWeekStartKey(date);
            const dayKey = this.getDayKey(date);

            const weekEntry = userData.weightIns.find(entry => entry.weekStart === weekStartDate);
            if (weekEntry && weekEntry.days && weekEntry.days[dayKey]) {
                return weekEntry.days[dayKey];
            }

            return null;
        } catch (error) {
            console.error('Error getting weight for date:', error);
            return null;
        }
    }

    static async getCurrentWeekData(userId, date) {
        try {
            const userData = await this.getUserWeightData(userId);
            if (!userData || !userData.weightIns) return null;

            const weekStartDate = this.getLocalWeekStartKey(date);

            let weekEntry = userData.weightIns.find(entry => entry.weekStart === weekStartDate);

            if (!weekEntry) {
                const [y, m, d] = weekStartDate.split('-').map(Number);
                const shiftedDate = new Date(y, m - 1, d + 1);
                const shiftedKey = this.formatDateKey(shiftedDate);
                weekEntry = userData.weightIns.find(entry => entry.weekStart === shiftedKey);
            }

            if (weekEntry) {
                return {
                    weekStart: weekEntry.weekStart,
                    days: weekEntry.days,
                    average: weekEntry.average,
                    weighInCount: Object.keys(weekEntry.days).length,
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting current week data:', error);
            return null;
        }
    }

    static async getWeightTrend(userId, date) {
        try {
            const userData = await this.getUserWeightData(userId);
            if (!userData || !userData.weightIns || userData.weightIns.length < 2) {
                return { trend: null, lastWeekAverage: null, currentWeekAverage: null };
            }

            const weekStartDate = this.getLocalWeekStartKey(date);
            const sortedWeightIns = [...userData.weightIns].sort((a, b) =>
                new Date(a.weekStart) - new Date(b.weekStart)
            );

            const currentWeekIndex = sortedWeightIns.findIndex(entry => entry.weekStart === weekStartDate);

            if (currentWeekIndex > 0) {
                const currentWeek = sortedWeightIns[currentWeekIndex];
                const lastWeek = sortedWeightIns[currentWeekIndex - 1];

                if (currentWeek?.average && lastWeek?.average) {
                    const trend = parseFloat((currentWeek.average - lastWeek.average).toFixed(2));
                    return {
                        trend,
                        lastWeekAverage: lastWeek.average,
                        currentWeekAverage: currentWeek.average,
                    };
                }
            }

            return { trend: null, lastWeekAverage: null, currentWeekAverage: null };
        } catch (error) {
            console.error('Error getting weight trend:', error);
            return { trend: null, lastWeekAverage: null, currentWeekAverage: null };
        }
    }

    static async getWeightHistory(userId, weeks = 12) {
        try {
            const userData = await this.getUserWeightData(userId);
            if (!userData || !userData.weightIns) return [];

            const sortedWeightIns = [...userData.weightIns]
                .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
                .slice(0, weeks);

            return sortedWeightIns.map(entry => ({
                weekStart: entry.weekStart,
                average: entry.average,
                weighInCount: Object.keys(entry.days || {}).length,
                days: entry.days,
            }));
        } catch (error) {
            console.error('Error getting weight history:', error);
            return [];
        }
    }
}

export default WeightService;