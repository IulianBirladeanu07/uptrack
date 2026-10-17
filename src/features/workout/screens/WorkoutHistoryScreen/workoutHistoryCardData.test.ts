import { getWorkoutHistoryCardData } from './workoutHistoryCardData';

describe('getWorkoutHistoryCardData', () => {
    it('projects card totals, labels, and best/PR exercise details', () => {
        const now = new Date();
        const timestamp = { seconds: now.getTime() / 1000 };

        expect(getWorkoutHistoryCardData({
            timestamp,
            workoutName: 'Upper A',
            duration: '85:00',
            totalPRs: 1,
            exercises: [
                {
                    exerciseName: 'Bench Press',
                    sets: [
                        { weight: 60, reps: 8, isPR: true },
                        { weight: 50, reps: 12 },
                    ],
                },
                {
                    exerciseName: 'Push-up',
                    sets: [{ weight: 0, reps: 15 }],
                },
            ],
        })).toEqual({
            exercises: [
                {
                    exerciseName: 'Bench Press',
                    setCount: 2,
                    bestSetLabel: '60kg × 8',
                    hasPR: true,
                },
                {
                    exerciseName: 'Push-up',
                    setCount: 1,
                    bestSetLabel: '15 reps',
                    hasPR: false,
                },
            ],
            totalSets: 3,
            durationMinutes: 85,
            workoutTitle: 'Upper A',
            dateLabel: 'TODAY',
            isToday: true,
            totalPRs: 1,
            hasPRs: true,
        });
    });

    it('preserves default labels and empty/missing-value fallbacks', () => {
        expect(getWorkoutHistoryCardData({
            timestamp: undefined,
            duration: 45,
            totalPRs: 0,
        })).toEqual({
            exercises: [],
            totalSets: 0,
            durationMinutes: 0,
            workoutTitle: 'Recent Workout',
            dateLabel: 'RECENT',
            isToday: false,
            totalPRs: 0,
            hasPRs: false,
        });
    });
});
