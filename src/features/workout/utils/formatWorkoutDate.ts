type TimestampWithDateMethod = {
    seconds?: unknown;
    _seconds?: unknown;
    toDate?: unknown;
};

const isRecord = (value: unknown): value is TimestampWithDateMethod =>
    typeof value === 'object' && value !== null;

const toDate = (value: unknown): Date | null => {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'string') {
        const localDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (localDate) {
            const year = Number(localDate[1]);
            const month = Number(localDate[2]);
            const day = Number(localDate[3]);
            const date = new Date(year, month - 1, day);
            return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
                ? date
                : null;
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    if (!isRecord(value)) return null;

    if (typeof value.toDate === 'function') {
        const date = value.toDate.call(value) as unknown;
        if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }

    const seconds = typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
            ? value._seconds
            : null;
    if (seconds === null || !Number.isFinite(seconds)) return null;

    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatWorkoutDate = (value: unknown, fallback = 'Recent'): string => {
    const date = toDate(value);
    if (!date) return fallback;
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};
