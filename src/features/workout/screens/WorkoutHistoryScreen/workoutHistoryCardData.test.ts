import { getWorkoutHistoryCardData } from './workoutHistoryCardData';
import { formatWorkoutHistoryDate } from './workoutHistoryPresentation';

describe('getWorkoutHistoryCardData', () => {
    it('projects card totals, labels, and per-set PR details', () => {
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
                        { weight: '60kg', reps: [{ label: '8', isPR: true }], label: '60kg × 8' },
                        { weight: '50kg', reps: [{ label: '12', isPR: false }], label: '50kg × 12' },
                    ],
                    hasPR: true,
                },
                {
                    exerciseName: 'Push-up',
                    setCount: 1,
                    setGroups: [{
                        weight: '',
                        reps: [{ label: '15 reps', isPR: false }],
                        label: '15 reps',
                    }],
                    hasPR: false,
                },
            ],
            totalSets: 3,
            durationMinutes: 85,
            workoutTitle: 'Upper A',
            dateLabel: formatWorkoutHistoryDate(timestamp),
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
            dateLabel: 'Recent',
            totalPRs: 0,
            hasPRs: false,
        });
    });
});

describe('personal record count', () => {
    it('counts PR exercises while preserving the performed order', () => {
        const data = getWorkoutHistoryCardData({
            timestamp: undefined,
            exercises: [
                { exerciseName: 'Squat', sets: [{ weight: 100, reps: 5 }, { weight: 90, reps: 5 }] },
                { exerciseName: 'Curl', sets: [{ weight: 20, reps: 10, isPR: true }, { weight: 20, reps: 9, isPR: true }] },
                { exerciseName: 'Row', sets: [{ weight: 60, reps: 10 }] },
            ],
        });

        expect(data.totalPRs).toBe(1);
        expect(data.hasPRs).toBe(true);
        expect(data.exercises.map(exercise => exercise.exerciseName)).toEqual(['Squat', 'Curl', 'Row']);
        expect(data.exercises.map(exercise => exercise.hasPR)).toEqual([false, true, false]);
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

    it('joins consecutive same-weight sets while retaining each set PR marker', () => {
        expect(groupsOf([
            { weight: 160, reps: 10 },
            { weight: 160, reps: 10 },
            { weight: 160, reps: 9 },
        ])).toEqual([{
            weight: '160kg',
            reps: [
                { label: '10', isPR: false },
                { label: '10', isPR: false },
                { label: '9', isPR: false },
            ],
            label: '160kg × 10, 10, 9',
        }]);
    });

    it('starts a new group when the weight changes', () => {
        expect(groupsOf([
            { weight: 240, reps: 12 },
            { weight: 230, reps: 12 },
            { weight: 230, reps: 10 },
        ])).toEqual([
            { weight: '240kg', reps: [{ label: '12', isPR: false }], label: '240kg × 12' },
            {
                weight: '230kg',
                reps: [{ label: '12', isPR: false }, { label: '10', isPR: false }],
                label: '230kg × 12, 10',
            },
        ]);
    });

    it('marks only the individual PR set within a same-weight group', () => {
        expect(groupsOf([
            { weight: 100, reps: 5, isPR: true },
            { weight: 100, reps: 4 },
            { weight: 90, reps: 5 },
        ])).toEqual([
            {
                weight: '100kg',
                reps: [{ label: '5', isPR: true }, { label: '4', isPR: false }],
                label: '100kg × 5, 4',
            },
            { weight: '90kg', reps: [{ label: '5', isPR: false }], label: '90kg × 5' },
        ]);
    });

    it('lists bodyweight reps without repeating the unit', () => {
        expect(groupsOf([
            { weight: 0, reps: 15 },
            { weight: 0, reps: 12 },
        ])).toEqual([{
            weight: '',
            reps: [{ label: '15 reps', isPR: false }, { label: '12 reps', isPR: false }],
            label: '15, 12 reps',
        }]);
    });
});
