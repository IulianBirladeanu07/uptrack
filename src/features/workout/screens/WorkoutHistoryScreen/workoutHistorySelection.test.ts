import { toHistorySelectedWorkout } from './workoutHistorySelection';

describe('toHistorySelectedWorkout', () => {
    it('maps workout and exercise data with the existing selection defaults', () => {
        expect(toHistorySelectedWorkout({
            note: 'Keep strict form',
            workoutName: 'Upper A',
            exercises: [{
                exerciseName: 'Bench Press',
                imageURL: 'bench.png',
                muscleGroup: 'Chest',
                category: 'Strength',
                numSets: 4,
                repRange: '8-12',
                note: 'Pause at chest',
                restBetweenSets: '180',
                lastWorkoutSets: [{ weight: 60, reps: 8 }],
                sets: [{ weight: 60, reps: 8 }, { weight: null, reps: null }],
            }],
        })).toEqual({
            note: 'Keep strict form',
            templateName: 'Upper A',
            exercises: [{
                exerciseName: 'Bench Press',
                imageURL: 'bench.png',
                muscleGroup: 'Chest',
                category: 'Strength',
                numSets: 4,
                repRange: '8-12',
                note: 'Pause at chest',
                restBetweenSets: '180',
                lastWorkoutSets: [{ weight: 60, reps: 8 }],
                sets: [
                    { weight: '60', reps: '8', isValidated: false, repsModified: false },
                    { weight: '', reps: '', isValidated: false, repsModified: false },
                ],
            }],
        });
    });

    it('uses workout and exercise fallbacks for missing metadata and set counts', () => {
        expect(toHistorySelectedWorkout({
            exercises: [{
                exerciseName: 'Row',
                numSets: 0,
                sets: [{ weight: 0, reps: 0 }],
            }],
        })).toEqual({
            note: '',
            templateName: '',
            exercises: [{
                exerciseName: 'Row',
                imageURL: '',
                muscleGroup: '',
                category: '',
                numSets: '1',
                repRange: '',
                note: '',
                restBetweenSets: '',
                lastWorkoutSets: [],
                sets: [{ weight: '0', reps: '', isValidated: false, repsModified: false }],
            }],
        });
    });
});
