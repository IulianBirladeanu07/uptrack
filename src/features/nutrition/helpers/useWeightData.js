import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeightService from '../services/weightService';

const useWeightData = (userId, selectedDate) => {
    const [weightData, setWeightData] = useState({
        currentWeight: null,
        weeklyAverage: null,
        lastWeekAverage: null,
        weeklyTrend: null,
        weighInCount: 0,
    });

    const isFetchingRef = useRef(false);
    const loadedDatesRef = useRef(new Set());
    const dateString = selectedDate.toISOString().split('T')[0];

    useEffect(() => {
        if (!userId) return;
        const seedFromCache = async () => {
            try {
                const cachedData = await AsyncStorage.getItem(`user_${userId}`);
                if (!cachedData) return;
                const parsed = JSON.parse(cachedData);
                if (!parsed?.weightIns) return;
                const sortedWeeks = [...parsed.weightIns].sort((a, b) =>
                    new Date(b.weekStart) - new Date(a.weekStart)
                );
                const currentWeek = sortedWeeks[0];
                const lastWeek = sortedWeeks[1];
                setWeightData({
                    currentWeight: parsed.currentWeight || null,
                    weeklyAverage: currentWeek?.average || null,
                    lastWeekAverage: lastWeek?.average || null,
                    weeklyTrend: parsed.weeklyTrend || null,
                    weighInCount: currentWeek ? Object.keys(currentWeek.days).length : 0,
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