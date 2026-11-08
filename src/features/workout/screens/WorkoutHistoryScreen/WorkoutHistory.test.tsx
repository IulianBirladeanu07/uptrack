import React from 'react';
import { SectionList, StyleSheet } from 'react-native';
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
    return {
        SafeAreaView: View,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

jest.mock('../../../../shared/navigation', () => ({
    useAppNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
    const { Text } = require('react-native');
    return ({ name, ...props }: { name: string; [key: string]: unknown }) => <Text {...props}>{name}</Text>;
});

const exercise = (exerciseName: string, sets: { weight: number; reps: number; isPR?: boolean }[]) => ({ exerciseName, sets });

const flattenText = (node: unknown): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(flattenText).join('');
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) return flattenText(node.props.children);
    return '';
};

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
    return renderScreenWithHistory([workoutItem]);
};

const renderScreenWithHistory = (workoutItems: typeof workout[], activeWorkout: unknown = null) => {
    const value = {
        workoutHistory: workoutItems,
        workoutHistoryLoading: false,
        workoutHistoryRefreshing: false,
        workoutHistoryError: null,
        retryWorkoutHistory: jest.fn(),
        activeWorkout,
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
    it('shows the first three exercises with full set details in performed order', () => {
        renderScreen();

        const rows = [0, 1, 2].map(index => screen.getByTestId(`exercise-row-${index}`));
        expect(rows.map(row => row.props.accessibilityLabel.split(',')[0])).toEqual(['Squat', 'Deadlift', 'Leg Press']);
        expect(screen.getByLabelText('Squat, 1 set, 100kg × 5')).toBeTruthy();
        expect(screen.getByLabelText('Deadlift, 1 set, 120kg × 5')).toBeTruthy();
        expect(screen.getByLabelText('Leg Press, 1 set, 200kg × 10')).toBeTruthy();
        expect(screen.queryByText('3x')).toBeNull();
        expect(screen.queryByText('1x')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(screen.getAllByText('trophy')).toHaveLength(1);
        expect(screen.queryByText('PR')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('pr-indicator-0').props.style).width).toBe(normalize(16));
        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.queryByText('Hip Abduction')).toBeNull();
        expect(screen.getByLabelText('Sets: 100kg × 5')).toBeTruthy();
        expect(screen.getByText('60 min').props.allowFontScaling).toBe(true);
        expect(screen.getByText('Lower II').props.allowFontScaling).toBe(true);
        expect(screen.getByText('Workout history')).toBeTruthy();
        expect(screen.getByLabelText('60 minutes')).toBeTruthy();
        expect(screen.getByLabelText('5 exercises')).toBeTruthy();
        expect(screen.getByLabelText('7 sets')).toBeTruthy();
        expect(screen.getByText(/^(Today|Yesterday|[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2})$/)).toBeTruthy();
        const dateTextStyle = StyleSheet.flatten(screen.getByText(/^(Today|Yesterday|[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2})$/).props.style);
        expect(dateTextStyle.fontSize).toBe(normalize(14));
        expect(dateTextStyle.color).toBe(colors.text.secondary);
        expect(dateTextStyle.textAlign).toBe('right');
        expect(dateTextStyle.backgroundColor).toBeUndefined();
        expect(dateTextStyle.borderWidth).toBeUndefined();
        expect(screen.queryByText('EXERCISE')).toBeNull();
        expect(screen.queryByText('BEST')).toBeNull();
        const repeatButtonStyle = StyleSheet.flatten(screen.getByLabelText('Repeat Lower II').props.style);
        expect(repeatButtonStyle.width).toBeUndefined();
        expect(repeatButtonStyle.minHeight).toBe(normalize(48));
        expect(repeatButtonStyle.backgroundColor).toBeUndefined();
        expect(repeatButtonStyle.borderWidth).toBeUndefined();
        expect(repeatButtonStyle.borderLeftWidth).toBe(1);
        expect(screen.getByText('Repeat')).toBeTruthy();
        expect(screen.getByLabelText('View Lower II details')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('workout-card-header').props.style).alignItems).toBe('center');
        expect(StyleSheet.flatten(screen.getByTestId('workout-card-header').props.style).marginBottom).toBe(normalize(4));
        expect(StyleSheet.flatten(screen.getByTestId('workout-stats-meta').props.style).marginBottom).toBe(normalize(12));
        expect(StyleSheet.flatten(screen.getByTestId('workout-stats-meta').props.style).flexWrap).toBe('wrap');
        expect(StyleSheet.flatten(screen.getByTestId('workout-card').props.style).marginBottom).toBe(normalize(12));
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.children.props.style).paddingVertical).toBe(normalize(4));
        const cardStyle = StyleSheet.flatten(screen.getByTestId('workout-card').props.style);
        expect(cardStyle.padding).toBe(0);
        expect(cardStyle.overflow).toBe('hidden');
        const cardContentStyle = StyleSheet.flatten(screen.getByTestId('workout-card-content').props.style);
        expect(cardContentStyle.paddingHorizontal).toBe(normalize(16));
        expect(cardContentStyle.paddingTop).toBe(normalize(16));
        expect(screen.getByText('Show 2 more')).toBeTruthy();
        const cardActionsStyle = StyleSheet.flatten(screen.getByTestId('workout-card-actions').props.style);
        expect(cardActionsStyle.minHeight).toBe(normalize(48));
        expect(cardActionsStyle.paddingTop).toBeUndefined();
        expect(cardActionsStyle.gap).toBeUndefined();
        expect(cardActionsStyle.borderTopWidth).toBe(1);
        const toggleTextStyle = StyleSheet.flatten(screen.getByText('Show 2 more').props.style);
        expect(toggleTextStyle.color).toBe(colors.accent.primary);
        expect(toggleTextStyle.fontSize).toBe(normalize(12));
        const toggle = screen.getByLabelText('Show 2 more exercises');
        const toggleStyle = StyleSheet.flatten(toggle.props.style);
        expect(toggleStyle.justifyContent).toBe('center');
        expect(toggleStyle.minHeight).toBe(normalize(24));
        expect(toggle.props.hitSlop).toEqual({ top: 12, bottom: 12 });
        expect(toggleStyle.borderBottomWidth).toBeUndefined();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-list-toggle-leading-line').props.style).flex).toBe(1);
        expect(StyleSheet.flatten(screen.getByTestId('exercise-list-toggle-leading-line').props.style).height).toBe(1);
        expect(StyleSheet.flatten(screen.getByTestId('exercise-list-toggle-trailing-line').props.style).flex).toBe(1);
        expect(screen.queryByText('chevron-down')).toBeNull();
    });

    it('reveals all exercises from a show-more action and can collapse the preview again', () => {
        renderScreen();

        fireEvent.press(screen.getByLabelText('Show 2 more exercises'));

        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.queryByText('3x')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(screen.getByLabelText('Hip Abduction, 3 sets, 108kg × 12, 10 · 105kg × 9, personal record set: 108kg × 12')).toBeTruthy();
        expect(screen.getByLabelText('Sets: 108kg × 12, 10 · 105kg × 9, personal record set: 108kg × 12')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-set-details-4').props.children.props.style).color).toBe(colors.text.secondary);
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
        const showLess = screen.getByLabelText('Show fewer exercises');
        expect(StyleSheet.flatten(showLess.props.style).minHeight).toBe(normalize(24));
        expect(showLess.props.hitSlop).toEqual({ top: 12, bottom: 12 });
        const expandedActionsStyle = StyleSheet.flatten(screen.getByTestId('workout-card-actions').props.style);
        expect(expandedActionsStyle.minHeight).toBe(normalize(48));
        expect(expandedActionsStyle.paddingTop).toBeUndefined();
        expect(expandedActionsStyle.borderTopWidth).toBe(1);
        expect(screen.queryByTestId('exercise-list-toggle-leading-line')).toBeNull();
        expect(screen.queryByTestId('exercise-list-toggle-trailing-line')).toBeNull();
        expect(screen.queryByText('Repeat workout')).toBeNull();

        fireEvent.press(screen.getByLabelText('Show fewer exercises'));

        expect(screen.queryByText('Calf Raise')).toBeNull();
        expect(screen.queryByText('Hip Abduction')).toBeNull();
        expect(screen.getByText('Leg Press')).toBeTruthy();
        expect(screen.getByLabelText('Show 2 more exercises')).toBeTruthy();
    });

    it('keeps the collapsed toggle label focused on the exercise count', () => {
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

        expect(screen.getByLabelText('9 exercises')).toBeTruthy();
        expect(screen.getByLabelText('4 personal records')).toBeTruthy();
        expect(screen.getByText('Show 6 more')).toBeTruthy();
        expect(screen.getByLabelText('Show 6 more exercises')).toBeTruthy();
        expect(screen.queryByText(/Show 6 more.*PR/)).toBeNull();
    });

    it('uses a trophy in collapsed rows and keeps two-line set details in both states', () => {
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
                exercise('Other Exercise 1', [{ weight: 40, reps: 10 }]),
                exercise('Other Exercise 2', [{ weight: 30, reps: 8 }]),
                exercise('Other Exercise 3', [{ weight: 20, reps: 6 }]),
            ],
        };
        renderScreenWithWorkout(longWorkout);

        const title = screen.getByText(longWorkout.workoutName);
        expect(title.props.numberOfLines).toBe(1);
        expect(title.props.ellipsizeMode).toBe('tail');
        const name = screen.getByText('Very Long Exercise Name That Must Truncate Before Its PR Icon');
        expect(name.props.numberOfLines).toBe(1);
        expect(name.props.ellipsizeMode).toBe('tail');
        expect(screen.getAllByText('trophy')).toHaveLength(2);
        expect(screen.queryByText('PR')).toBeNull();
        expect(screen.getByLabelText(/Very Long Exercise Name.*5 sets.*personal record set: 240kg × 12/)).toBeTruthy();
        const collapsedSetDetails = screen.getByTestId('exercise-set-details-0').props.children;
        expect(collapsedSetDetails.props.numberOfLines).toBe(2);
        expect(collapsedSetDetails.props.ellipsizeMode).toBe('tail');
        expect(flattenText(collapsedSetDetails)).toBe('240kg × 12 · 230kg × 12 · 220kg × 10 · 210kg × 9 · 200kg × 8');
        fireEvent.press(screen.getByLabelText('Show 1 more exercise'));
        const setDetails = screen.getByTestId('exercise-set-details-0').props.children;
        expect(setDetails.props.numberOfLines).toBe(2);
        expect(setDetails.props.ellipsizeMode).toBe('tail');
        expect(flattenText(setDetails)).toBe(flattenText(collapsedSetDetails));
        expect(screen.getByLabelText(`Repeat ${longWorkout.workoutName}`)).toBeTruthy();
    });

    it('highlights the marked PR set in the collapsed row when it is not the strongest set', () => {
        renderScreenWithWorkout({
            ...workout,
            exercises: [
                exercise('Squat', [
                    { weight: 80, reps: 10, isPR: true },
                    { weight: 100, reps: 5 },
                ]),
            ],
        });

        expect(screen.getByLabelText('Squat, 2 sets, 80kg × 10 · 100kg × 5, personal record set: 80kg × 10')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-set-details-0').props.children.props.style).color).toBe(colors.text.secondary);
    });

    it('separates mixed weights and highlights the PR value', () => {
        renderScreenWithWorkout({
            ...workout,
            exercises: [
                exercise('Drop Set', [
                    { weight: 100, reps: 8 },
                    { weight: 90, reps: 10, isPR: true },
                    { weight: 90, reps: 8 },
                ]),
            ],
        });

        const details = screen.getByTestId('exercise-set-details-0');
        expect(flattenText(details.props.children)).toBe('100kg × 8 · 90kg × 10, 8');
        expect(screen.getByLabelText('Sets: 100kg × 8 · 90kg × 10, 8, personal record set: 90kg × 10')).toBeTruthy();
        expect(StyleSheet.flatten(details.props.children.props.style).color).toBe(colors.text.secondary);
    });

    it('shows a single exercise without PR or expansion controls', () => {
        renderScreenWithWorkout({
            ...workout,
            exercises: [exercise('Bench Press', [{ weight: 60, reps: 8 }])],
        });

        expect(screen.getByText('Bench Press')).toBeTruthy();
        expect(screen.getByLabelText('1 exercise')).toBeTruthy();
        expect(screen.queryByText('PR')).toBeNull();
        expect(screen.queryByLabelText(/Show \d+ more exercises/)).toBeNull();
        expect(screen.queryByLabelText(/personal records/)).toBeNull();
    });

    it('shows the section session count and keeps its header sticky', () => {
        const history = Array.from({ length: 12 }, (_, index) => ({
            ...workout,
            id: `w${index}`,
            timestamp: { seconds: Math.floor(Date.now() / 1000) - index * 60 },
        }));
        renderScreenWithHistory(history);

        expect(screen.getByText('12 workouts')).toBeTruthy();
        expect(screen.getByText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })).props.style).fontSize).toBe(normalize(14));
        expect(screen.UNSAFE_getByType(SectionList).props.stickySectionHeadersEnabled).toBe(true);
        const list = screen.UNSAFE_getByType(SectionList);
        expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom).toBe(128);
    });

    it('opens the selected workout from the repeat control without starting it directly', () => {
        mockNavigate.mockClear();
        renderScreen();

        fireEvent.press(screen.getByLabelText('Repeat Lower II'));

        expect(mockNavigate).toHaveBeenCalledWith('StartWorkout', expect.objectContaining({
            selectedWorkout: expect.objectContaining({ templateName: 'Lower II' }),
        }));
    });

    it('disables Repeat while another workout is active', () => {
        mockNavigate.mockClear();
        renderScreenWithHistory([workout], { id: 'active-workout' });

        const repeat = screen.getByLabelText('A workout is already in progress');
        expect(repeat.props.accessibilityState.disabled).toBe(true);
        fireEvent.press(repeat);
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the full workout details from the view action', () => {
        mockNavigate.mockClear();
        renderScreen();

        fireEvent.press(screen.getByLabelText('View Lower II details'));

        expect(mockNavigate).toHaveBeenCalledWith('WorkoutDetails', expect.objectContaining({
            duration: '60:00',
            workoutName: 'Lower II',
            exercises: workout.exercises,
        }));
    });
});
