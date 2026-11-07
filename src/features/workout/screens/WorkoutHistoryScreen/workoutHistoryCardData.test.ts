import { getPreviewExercises, getWorkoutHistoryCardData } from './workoutHistoryCardData';

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
                    sets: [
                        { number: 1, label: '60kg × 8', weight: '60kg', reps: '8', isPR: true },
                        { number: 2, label: '50kg × 12', weight: '50kg', reps: '12', isPR: false },
                    ],
                    bestSetLabel: '60kg × 8',
                    best: { weight: '60kg', reps: '8' },
                    hasPR: true,
                },
                {
                    exerciseName: 'Push-up',
                    setCount: 1,
                    sets: [{ number: 1, label: '15 reps', weight: '', reps: '15 reps', isPR: false }],
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

describe('getPreviewExercises', () => {
    const ex = (name: string, hasPR = false) => ({ name, hasPR });

    it('keeps the first exercises when none has a PR', () => {
        const all = [ex('a'), ex('b'), ex('c'), ex('d')];

        expect(getPreviewExercises(all).map(e => e.name)).toEqual(['a', 'b', 'c']);
    });

    it('pulls PR exercises into the preview and keeps workout order', () => {
        const all = [ex('a'), ex('b'), ex('c'), ex('d'), ex('e', true), ex('f'), ex('g', true)];

        expect(getPreviewExercises(all).map(e => e.name)).toEqual(['a', 'e', 'g']);
    });

    it('limits the preview to PR exercises when there are more than the limit', () => {
        const all = [ex('a', true), ex('b', true), ex('c', true), ex('d', true), ex('e')];

        expect(getPreviewExercises(all).map(e => e.name)).toEqual(['a', 'b', 'c']);
    });

    it('returns everything when there are few exercises', () => {
        const all = [ex('a'), ex('b', true)];

        expect(getPreviewExercises(all)).toEqual(all);
    });
});
