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
    it('shows the PR count from the sets and pulls the PR exercise into the collapsed preview', () => {
        renderScreen();

        expect(screen.getByLabelText('1 personal record')).toBeTruthy();
        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.queryByText('Leg Press')).toBeNull();
        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.getByText('BEST')).toBeTruthy();
    });

    it('expands from the card header, lists every set and drops the duplicate best column', () => {
        renderScreen();

        fireEvent.press(screen.getByLabelText(/Expand full workout/));

        expect(screen.getByText('Calf Raise')).toBeTruthy();
        expect(screen.getByText('Set 2')).toBeTruthy();
        expect(screen.getByText('SETS')).toBeTruthy();
        expect(screen.queryByText('BEST')).toBeNull();
        expect(screen.getAllByText('108kg')).toHaveLength(2);
        expect(screen.getByText('Show less')).toBeTruthy();

        fireEvent.press(screen.getByLabelText('Collapse full workout'));

        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.getByText('BEST')).toBeTruthy();
    });
});
