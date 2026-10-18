import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { formatLocalDateKey } from '../utils/localDateKey';

export const getLocalDayKey = formatLocalDateKey;

export const useLocalDayKey = (): string => {
    const [dayKey, setDayKey] = useState(() => getLocalDayKey(new Date()));

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const updateDayAndSchedule = () => {
            const now = new Date();
            setDayKey(getLocalDayKey(now));
            const nextMidnight = new Date(now);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            nextMidnight.setHours(0, 0, 0, 0);
            timer = setTimeout(updateDayAndSchedule, Math.max(nextMidnight.getTime() - now.getTime() + 50, 50));
        };

        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') {
                clearTimeout(timer);
                updateDayAndSchedule();
            }
        });

        updateDayAndSchedule();
        return () => {
            clearTimeout(timer);
            subscription.remove();
        };
    }, []);

    return dayKey;
};
