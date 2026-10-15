import { useState, useEffect, useCallback, useRef } from 'react';
import WeightService from '../services/weightService';
import { formatDate } from '../utils/dateUtils';
import { RequestTracker } from '../utils/requestTracker';
import type { DateInput, WeightDisplayData } from '../../../shared/types';

const useWeightData = (userId: string | null | undefined, selectedDate: DateInput) => {
    const [weightData, setWeightData] = useState<WeightDisplayData>({
        currentWeight: null,
        weeklyAverage: null,
        lastWeekAverage: null,
        weeklyTrend: null,
        weighInCount: 0,
    });

    const requestTracker = useRef(new RequestTracker());
    const loadedDatesRef = useRef(new Set<string>());
    const dateString = formatDate(selectedDate);

    const loadWeightData = useCallback(async (forceRefresh = false) => {
        if (!userId) return;

        const requestId = requestTracker.current.begin();
        const cacheKey = `${userId}-${dateString}`;
        if (!forceRefresh && loadedDatesRef.current.has(cacheKey)) return;

        try {
            const data = await WeightService.getWeightDisplayData(userId, selectedDate);
            if (!requestTracker.current.isCurrent(requestId)) return;
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
            if (requestTracker.current.isCurrent(requestId)) console.error(error);
        }
    }, [userId, dateString, selectedDate]);

    const refreshWeightData = useCallback(() => {
        loadWeightData(true);
    }, [loadWeightData]);

    useEffect(() => {
        if (userId) {
            loadWeightData();
        } else {
            requestTracker.current.invalidate();
        }
        return () => requestTracker.current.invalidate();
    }, [userId, dateString, loadWeightData]);

    return { weightData, refreshWeightData };
};

export default useWeightData;