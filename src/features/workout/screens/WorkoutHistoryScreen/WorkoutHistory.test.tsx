import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '../../../../shared/theme';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { WorkoutContext } from '../../context/WorkoutContext';
import WorkoutHistoryScreen from './WorkoutHistory';

const mockNavigate = jest.fn();

jest.mock('../../context/WorkoutContext', () => {
    const { createContext } = require('react');
    return { WorkoutContext: createContext(undefined) };
});

jest.mock('react-native-safe-area-context', () => {
    const { View } = require('react-native');
    return { SafeAreaView: View };
});

jest.mock('../../../../shared/navigation', () => ({
    useAppNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
    const { Text } = require('react-native');
    return ({ name, ...props }: { name: string; [key: string]: unknown }) => <Text {...props}>{name}</Text>;
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
        exercise('Hip Abduction', [
            { weight: 108, reps: 12, isPR: true },
            { weight: 108, reps: 10 },
            { weight: 105, reps: 9 },
        ]),
    ],
};

const renderScreen = () => {
    return renderScreenWithWorkout(workout);
};

const renderScreenWithWorkout = (workoutItem: typeof workout) => {
    const value = {
        workoutHistory: [workoutItem],
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
    it('chooses a PR-aware preview but keeps performed order in both states', () => {
        renderScreen();

        const rows = screen.getAllByLabelText(/, \d+ sets?,/);
        expect(rows.map(row => row.props.accessibilityLabel.split(',')[0])).toEqual(['Squat', 'Deadlift', 'Hip Abduction']);
        expect(screen.queryByText('3x')).toBeNull();
        expect(screen.queryByText('1x')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(StyleSheet.flatten(screen.getByText('108kg ×').props.style).color).toBe(colors.accent.primary);
        expect(StyleSheet.flatten(screen.getByTestId('pr-set-2-0-0').props.style).color).toBe(colors.accent.primary);
        expect(screen.getByText(', 10').props.style).toBeUndefined();
        expect(screen.getAllByText('trophy')).toHaveLength(1);
        expect(screen.getByLabelText(/Hip Abduction, 3 sets, .*personal record/)).toBeTruthy();
        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.queryByText('1 set')).toBeNull();
        const statsText = screen.getByTestId('workout-stats-meta').props.children;
        expect(statsText.props.allowFontScaling).toBe(true);
        expect(statsText.props.numberOfLines).toBeUndefined();
        expect(screen.getByLabelText('Today · 60 min · 5 exercises · 7 sets · 1 PR')).toBeTruthy();
        expect(screen.queryByText('EXERCISE')).toBeNull();
        expect(screen.queryByText('BEST')).toBeNull();
        expect(screen.getByLabelText('Hip Abduction, 3 sets, 108kg × 12, 10, 105kg × 9, personal record')).toBeTruthy();
        expect(screen.getByLabelText('Sets: 108kg × 12, 10, 105kg × 9').props.children.props.numberOfLines).toBe(2);
        const repeatButtonStyle = StyleSheet.flatten(screen.getByLabelText('Repeat Lower II').props.style);
        expect(repeatButtonStyle.width).toBeUndefined();
        expect(repeatButtonStyle.height).toBe(normalize(32));
        expect(repeatButtonStyle.backgroundColor).toBe(colors.faded.surface);
        expect(repeatButtonStyle.borderWidth).toBe(1);
        expect(screen.getByLabelText('Repeat Lower II').props.hitSlop).toBe(6);
        expect(screen.getByText('Repeat')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('workout-card-header').props.style).alignItems).toBe('center');
        expect(StyleSheet.flatten(screen.getByTestId('workout-card-header').props.style).marginBottom).toBe(normalize(12));
        expect(StyleSheet.flatten(screen.getByTestId('workout-stats-meta').props.style).marginBottom).toBe(normalize(12));
        expect(StyleSheet.flatten(screen.getByLabelText(/Expand Lower II exercises/).props.style).minHeight).toBeUndefined();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.children.props.style).paddingVertical).toBe(normalize(4));
        expect(StyleSheet.flatten(screen.getByTestId('workout-card').props.style).paddingBottom).toBe(0);
        expect(screen.getByLabelText(/Expand Lower II exercises/)).toBeTruthy();
        expect(screen.getByLabelText('Show 2 more exercises')).toBeTruthy();
        const toggleTextStyle = StyleSheet.flatten(screen.getByText('Show 2 more exercises').props.style);
        expect(toggleTextStyle.color).toBe(colors.accent.primary);
        expect(toggleTextStyle.fontSize).toBe(normalize(14));
        const toggleStyle = StyleSheet.flatten(screen.getByLabelText('Show 2 more exercises').props.style);
        expect(toggleStyle.justifyContent).toBe('center');
        expect(toggleStyle.minHeight).toBe(normalize(44));
        expect(screen.queryByLabelText(/Expand full workout/)).toBeNull();
    });

    it('reveals all exercises from a show-more action and can collapse the preview again', () => {
        renderScreen();

        fireEvent.press(screen.getByLabelText('Show 2 more exercises'));

        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.queryByText('3x')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(screen.getByLabelText('Hip Abduction, 3 sets, 108kg × 12, 10, 105kg × 9, personal record')).toBeTruthy();
        const rows = screen.getAllByLabelText(/, \d+ sets?,/);
        expect(rows.map(row => row.props.accessibilityLabel.split(',')[0])).toEqual([
            'Squat',
            'Deadlift',
            'Leg Press',
            'Calf Raise',
            'Hip Abduction',
        ]);
        expect(screen.getByText('Hip Abduction').props.numberOfLines).toBe(1);
        expect(screen.queryByText('1 set')).toBeNull();
        expect(screen.queryByText('BEST')).toBeNull();
        expect(screen.queryByText('EXERCISE')).toBeNull();
        expect(screen.queryByText(/^Set \d/)).toBeNull();
        expect(screen.getByLabelText('Show fewer exercises')).toBeTruthy();
        expect(screen.getByLabelText('Repeat Lower II')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByText('Show less').props.style).color).toBe(colors.accent.primary);
        expect(StyleSheet.flatten(screen.getByLabelText('Show fewer exercises').props.style).minHeight).toBe(normalize(44));
        expect(screen.queryByText('Repeat workout')).toBeNull();

        fireEvent.press(screen.getByLabelText(/Collapse Lower II exercises/));

        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.getByLabelText('Show 2 more exercises')).toBeTruthy();
    });

    it('shows the count of hidden PR exercises on the collapsed toggle', () => {
        const upperWorkout = {
            ...workout,
            workoutName: 'Upper II',
            exercises: [
                exercise('Exercise 1', [{ weight: 100, reps: 8, isPR: true }]),
                exercise('Exercise 2', [{ weight: 90, reps: 8, isPR: true }]),
                exercise('Exercise 3', [{ weight: 80, reps: 8, isPR: true }]),
                exercise('Exercise 4', [{ weight: 70, reps: 8, isPR: true }]),
                exercise('Exercise 5', [{ weight: 60, reps: 8 }]),
                exercise('Exercise 6', [{ weight: 50, reps: 8 }]),
                exercise('Exercise 7', [{ weight: 40, reps: 8 }]),
                exercise('Exercise 8', [{ weight: 30, reps: 8 }]),
                exercise('Exercise 9', [{ weight: 20, reps: 8 }]),
            ],
        };
        renderScreenWithWorkout(upperWorkout);

        expect(screen.getByLabelText(/Today · 60 min · 9 exercises · 9 sets · 4 PRs/)).toBeTruthy();
        expect(screen.getByText('Show 6 more · 1 PR')).toBeTruthy();
        expect(screen.getByLabelText('Show 6 more exercises, including 1 personal record')).toBeTruthy();
    });

    it('keeps PR trophies on the exercise-name line and truncates long set details to two lines', () => {
        const longWorkout = {
            ...workout,
            workoutName: 'A Very Long Workout Name That Must Truncate Before the Repeat Control',
            exercises: [
                exercise('Very Long Exercise Name That Must Truncate Before Its PR Icon', [
                    { weight: 240, reps: 12, isPR: true },
                    { weight: 230, reps: 12 },
                    { weight: 220, reps: 10 },
                    { weight: 210, reps: 9 },
                    { weight: 200, reps: 8 },
                ]),
            ],
        };
        renderScreenWithWorkout(longWorkout);

        const title = screen.getByText(longWorkout.workoutName);
        expect(title.props.numberOfLines).toBe(1);
        expect(title.props.ellipsizeMode).toBe('tail');
        const name = screen.getByText('Very Long Exercise Name That Must Truncate Before Its PR Icon');
        expect(name.props.numberOfLines).toBe(1);
        expect(name.props.ellipsizeMode).toBe('tail');
        expect(screen.getAllByText('trophy')).toHaveLength(1);
        expect(screen.getByLabelText(/Very Long Exercise Name.*personal record/)).toBeTruthy();
        const setDetails = screen.getByTestId('exercise-set-details-0').props.children;
        expect(setDetails.props.numberOfLines).toBe(2);
        expect(setDetails.props.ellipsizeMode).toBe('tail');
        expect(screen.getByLabelText(`Repeat ${longWorkout.workoutName}`)).toBeTruthy();
    });

    it('opens the selected workout from the repeat control without starting it directly', () => {
        mockNavigate.mockClear();
        renderScreen();

        fireEvent.press(screen.getByLabelText('Repeat Lower II'));

        expect(mockNavigate).toHaveBeenCalledWith('StartWorkout', expect.objectContaining({
            selectedWorkout: expect.objectContaining({ templateName: 'Lower II' }),
        }));
    });
});
