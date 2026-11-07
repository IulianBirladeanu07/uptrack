import { getWorkoutHistoryCardData } from './workoutHistoryCardData';

describe('getWorkoutHistoryCardData', () => {
    it('projects card totals, labels, and best/PR exercise details', () => {
        const now = new Date();
        const timestamp = { seconds: now.getTime() / 1000 };

        expect(getWorkoutHistoryCardData({
            timestamp,
            workoutName: 'Upper A',
            duration: '85:00',
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
                    setGroups: [
                        { label: '60kg × 8', isPR: true },
                        { label: '50kg × 12', isPR: false },
                    ],
                    bestSetLabel: '60kg × 8',
                    best: { weight: '60kg', reps: '8' },
                    hasPR: true,
                },
                {
                    exerciseName: 'Push-up',
                    setCount: 1,
                    setGroups: [{ label: '15 reps', isPR: false }],
                    bestSetLabel: '15 reps',
                    best: { weight: '', reps: '15 reps' },
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

describe('personal record count', () => {
    it('is counted from the PR sets, not from a stored total that is never saved', () => {
        const data = getWorkoutHistoryCardData({
            timestamp: undefined,
            exercises: [
                { exerciseName: 'Squat', sets: [{ weight: 100, reps: 5, isPR: true }, { weight: 90, reps: 5 }] },
                { exerciseName: 'Curl', sets: [{ weight: 20, reps: 10, isPR: true }, { weight: 20, reps: 9, isPR: true }] },
                { exerciseName: 'Row', sets: [{ weight: 60, reps: 10 }] },
            ],
        });

        expect(data.totalPRs).toBe(3);
        expect(data.hasPRs).toBe(true);
    });

    it('is zero without PR sets', () => {
        const data = getWorkoutHistoryCardData({
            timestamp: undefined,
            exercises: [{ exerciseName: 'Row', sets: [{ weight: 60, reps: 10 }] }],
        });

        expect(data.totalPRs).toBe(0);
        expect(data.hasPRs).toBe(false);
    });
});

describe('set groups', () => {
    const groupsOf = (sets: { weight: number; reps: number; isPR?: boolean }[]) =>
        getWorkoutHistoryCardData({
            timestamp: undefined,
            exercises: [{ exerciseName: 'Lift', sets }],
        }).exercises[0]?.setGroups;

    it('joins consecutive sets with the same weight into one group', () => {
        expect(groupsOf([
            { weight: 160, reps: 10 },
            { weight: 160, reps: 10 },
            { weight: 160, reps: 9 },
        ])).toEqual([{ label: '160kg × 10, 10, 9', isPR: false }]);
    });

    it('starts a new group when the weight changes', () => {
        expect(groupsOf([
            { weight: 240, reps: 12 },
            { weight: 230, reps: 12 },
            { weight: 230, reps: 10 },
        ])).toEqual([
            { label: '240kg × 12', isPR: false },
            { label: '230kg × 12, 10', isPR: false },
        ]);
    });

    it('marks a group as a PR when any of its sets is a PR', () => {
        expect(groupsOf([
            { weight: 100, reps: 5, isPR: true },
            { weight: 100, reps: 4 },
            { weight: 90, reps: 5 },
        ])).toEqual([
            { label: '100kg × 5, 4', isPR: true },
            { label: '90kg × 5', isPR: false },
        ]);
    });

    it('lists bodyweight reps without repeating the unit', () => {
        expect(groupsOf([
            { weight: 0, reps: 15 },
            { weight: 0, reps: 12 },
        ])).toEqual([{ label: '15, 12 reps', isPR: false }]);
    });
});
