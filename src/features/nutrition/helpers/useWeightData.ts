import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeightService from '../services/weightService';
import { formatDate } from '../utils/dateUtils';
import type { DateInput, UserData, WeightDisplayData } from '../../../shared/types';

const useWeightData = (userId: string | null | undefined, selectedDate: DateInput) => {
    const [weightData, setWeightData] = useState<WeightDisplayData>({
        currentWeight: null,
        weeklyAverage: null,
        lastWeekAverage: null,
        weeklyTrend: null,
        weighInCount: 0,
    });

    const isFetchingRef = useRef(false);
    const loadedDatesRef = useRef(new Set());
    const dateString = formatDate(selectedDate);

    useEffect(() => {
        if (!userId) return;
        const seedFromCache = async () => {
            try {
                const cachedData = await AsyncStorage.getItem(`user_${userId}`);
                if (!cachedData) return;
                const parsed = JSON.parse(cachedData) as UserData | null;
                if (!parsed?.weightIns) return;
                const sortedWeeks = [...parsed.weightIns].sort((a, b) =>
                    new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
                );
                const currentWeek = sortedWeeks[0];
                const lastWeek = sortedWeeks[1];
                if (currentWeek && !currentWeek.days) return;
                setWeightData({
                    currentWeight: parsed.currentWeight || null,
                    weeklyAverage: currentWeek?.average || null,
                    lastWeekAverage: lastWeek?.average || null,
                    weeklyTrend: parsed.weeklyTrend || null,
                    weighInCount: currentWeek?.days ? Object.keys(currentWeek.days).length : 0,
                });
            } catch {}
        };
        seedFromCache();
    }, [userId]);

    const loadWeightData = useCallback(async (forceRefresh = false) => {
        if (!userId || isFetchingRef.current) return;

        const cacheKey = `${userId}-${dateString}`;
        if (!forceRefresh && loadedDatesRef.current.has(cacheKey)) return;

        isFetchingRef.current = true;
        try {
            const data = await WeightService.getWeightDisplayData(userId, selectedDate);
            loadedDatesRef.current.add(cacheKey);
            setWeightData(prev => {
                const isIdentical =
                    prev.currentWeight === data.currentWeight &&
                    prev.weeklyAverage === data.weeklyAverage &&
                    prev.weighInCount === data.weighInCount &&
                    prev.weeklyTrend === data.weeklyTrend;
                return isIdentical ? prev : data;
            });
        } catch (error) {
            console.error(error);
        } finally {
            isFetchingRef.current = false;
        }
    }, [userId, dateString, selectedDate]);

    const refreshWeightData = useCallback(() => {
        loadWeightData(true);
    }, [loadWeightData]);

    useEffect(() => {
        if (userId) loadWeightData();
    }, [userId, dateString]);

    return { weightData, refreshWeightData };
};

export default useWeightData;