import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WorkoutContext } from '../../context/WorkoutContext';
import WorkoutHistoryScreen from './WorkoutHistory';

jest.mock('../../context/WorkoutContext', () => {
    const { createContext } = require('react');
    return { WorkoutContext: createContext(undefined) };
});

jest.mock('react-native-safe-area-context', () => {
    const { View } = require('react-native');
    return { SafeAreaView: View };
});

jest.mock('../../../../shared/navigation', () => ({
    useAppNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
    const { Text } = require('react-native');
    return ({ name }: { name: string }) => <Text>{name}</Text>;
});

const exercise = (exerciseName: string, sets: { weight: number; reps: number; isPR?: boolean }[]) => ({ exerciseName, sets });

const workout = {
    id: 'w1',
    workoutName: 'Lower II',
    timestamp: { seconds: Math.floor(Date.now() / 1000) },
    duration: '60:00',
    exercises: [
        exercise('Squat', [{ weight: 100, reps: 5 }]),
        exercise('Deadlift', [{ weight: 120, reps: 5 }]),
        exercise('Leg Press', [{ weight: 200, reps: 10 }]),
        exercise('Calf Raise', [{ weight: 80, reps: 12 }]),
        exercise('Hip Abduction', [{ weight: 108, reps: 12, isPR: true }, { weight: 108, reps: 9 }]),
    ],
};

const renderScreen = () => {
    const value = {
        workoutHistory: [workout],
        workoutHistoryLoading: false,
        workoutHistoryRefreshing: false,
        workoutHistoryError: null,
        retryWorkoutHistory: jest.fn(),
        activeWorkout: null,
        hasMoreWorkoutHistory: false,
        loadingMoreWorkoutHistory: false,
        workoutHistoryLoadMoreError: null,
        loadMoreWorkoutHistory: jest.fn(),
    };
    return render(
        <WorkoutContext.Provider value={value as never}>
            <WorkoutHistoryScreen />
        </WorkoutContext.Provider>,
    );
};

describe('WorkoutHistoryScreen card', () => {
    it('keeps the collapsed preview in workout order and still counts hidden PRs in the badge', () => {
        renderScreen();

        expect(screen.getByLabelText('1 personal record')).toBeTruthy();
        expect(screen.getByText('Squat')).toBeTruthy();
        expect(screen.getByText('Deadlift')).toBeTruthy();
        expect(screen.getByText('Leg Press')).toBeTruthy();
        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.queryByText('Hip Abduction')).toBeNull();
        expect(screen.getByText('BEST')).toBeTruthy();
    });

    it('expands from the card header and lists each exercise sets as compact groups', () => {
        renderScreen();

        fireEvent.press(screen.getByLabelText(/Expand full workout/));

        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.getByText('108kg × 12, 9')).toBeTruthy();
        expect(screen.getByText('100kg × 5')).toBeTruthy();
        expect(screen.getByText('BEST')).toBeTruthy();
        expect(screen.queryByText('SETS')).toBeNull();
        expect(screen.queryByText(/^Set \d/)).toBeNull();
        expect(screen.getByText('Show less')).toBeTruthy();

        fireEvent.press(screen.getByLabelText('Collapse full workout'));

        expect(screen.queryByText('108kg × 12, 9')).toBeNull();
        expect(screen.queryByText('Hip Abduction')).toBeNull();
    });
});
