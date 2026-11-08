import React from 'react';
import { SectionList, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, fontSize, spacing } from '../../../../shared/theme';
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

const hasPRTextStyle = (node: unknown): boolean => {
    if (Array.isArray(node)) return node.some(hasPRTextStyle);
    if (!React.isValidElement<{ children?: React.ReactNode; style?: StyleProp<TextStyle> }>(node)) return false;
    return StyleSheet.flatten(node.props.style)?.color === colors.accent.primary ||
        hasPRTextStyle(node.props.children);
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
    it('shows every exercise with set count and best set by default', () => {
        renderScreen();

        const rows = [0, 1, 2, 3, 4].map(index => screen.getByTestId(`exercise-group-${index}`));
        expect(rows.map(row => row.props.accessibilityLabel.split(',')[1].trim())).toEqual([
            'Squat',
            'Deadlift',
            'Leg Press',
            'Calf Raise',
            'Hip Abduction',
        ]);
        expect(screen.queryByTestId('exercise-table-header')).toBeNull();
        expect(screen.getAllByText('1x')).toHaveLength(4);
        expect(screen.getByText('3x')).toBeTruthy();
        expect(screen.getByText('100kg × 5')).toBeTruthy();
        expect(screen.getByText('200kg × 10')).toBeTruthy();
        expect(screen.getByTestId('best-set-4').props.children).toBe('108kg × 12');
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('best-set-4').props.style).color).toBe(colors.accent.primary);
        expect(StyleSheet.flatten(screen.getByTestId('exercise-row-0').props.children[0].props.style).color).toBe(colors.text.tertiary);
        expect(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details')).toBeTruthy();
        expect(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details').props.accessibilityHint).toBe('Shows every set for Hip Abduction');
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(screen.getAllByText('trophy')).toHaveLength(1);
        expect(screen.queryByText('PR')).toBeNull();
        expect(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).minHeight).toBeUndefined();
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
        expect(StyleSheet.flatten(screen.getByTestId('exercise-row-0').props.style).paddingVertical).toBe(normalize(4));
        expect(StyleSheet.flatten(screen.getByTestId('exercise-row-0').props.style).alignItems).toBe('center');
        expect(StyleSheet.flatten(screen.getByTestId('exercise-row-0').props.children[0].props.style).paddingTop).toBeUndefined();
        expect(StyleSheet.flatten(screen.getByTestId('best-set-0').props.style).paddingTop).toBeUndefined();
        const cardStyle = StyleSheet.flatten(screen.getByTestId('workout-card').props.style);
        expect(cardStyle.padding).toBe(0);
        expect(cardStyle.overflow).toBe('hidden');
        const cardContentStyle = StyleSheet.flatten(screen.getByTestId('workout-card-content').props.style);
        expect(cardContentStyle.paddingHorizontal).toBe(normalize(16));
        expect(cardContentStyle.paddingTop).toBe(normalize(16));
        expect(screen.queryByText('Show set details')).toBeNull();
        const cardActionsStyle = StyleSheet.flatten(screen.getByTestId('workout-card-actions').props.style);
        expect(cardActionsStyle.minHeight).toBe(normalize(48));
        expect(cardActionsStyle.paddingTop).toBeUndefined();
        expect(cardActionsStyle.gap).toBeUndefined();
        expect(cardActionsStyle.borderTopWidth).toBe(1);
        expect(cardActionsStyle.borderTopColor).toBe(colors.border.default);
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomColor).toBe(colors.border.default);
        expect(StyleSheet.flatten(screen.getByLabelText('View Lower II details').props.style).flex).toBe(1);
        expect(StyleSheet.flatten(screen.getByLabelText('Repeat Lower II').props.style).flex).toBe(1);
        expect(StyleSheet.flatten(screen.getByLabelText('Repeat Lower II').props.style).minHeight).toBe(normalize(48));
        expect(screen.getAllByText('chevron-down')).toHaveLength(5);
    });

    it('expands set details independently for each exercise row', () => {
        renderScreen();

        fireEvent.press(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details'));

        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.getByText('Calf Raise')).toBeTruthy();
        expect(screen.getByText('3x')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-group-0').props.style).borderBottomWidth).toBe(1);
        expect(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, all sets 108kg × 12, 10 · 105kg × 9, personal record set 108kg × 12, hide set details')).toBeTruthy();
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        expect(screen.queryByTestId('exercise-set-details-3')).toBeNull();
        const expandedSets = screen.getByTestId('exercise-set-details-4');
        expect(expandedSets.props.horizontal).toBe(true);
        expect(StyleSheet.flatten(expandedSets.props.style).flexGrow).toBeUndefined();
        expect(StyleSheet.flatten(expandedSets.props.style).flexWrap).toBeUndefined();
        expect(StyleSheet.flatten(expandedSets.props.style).flex).toBe(1);
        const setsText = screen.getByLabelText('Sets: 108kg × 12, 10 · 105kg × 9');
        expect(flattenText(setsText.props.children)).toBe('108kg × 12, 10 · 105kg × 9');
        expect(screen.queryByTestId('best-set-4')).toBeNull();
        expect(StyleSheet.flatten(screen.getByTestId('exercise-row-4').props.children[1].props.style).flex).toBe(1.1);
        expect(hasPRTextStyle(setsText.props.children)).toBe(true);
        expect(screen.getByText('chevron-up')).toBeTruthy();
        expect(screen.getByText('Hip Abduction').props.numberOfLines).toBe(1);
        expect(screen.queryByText(/^Set \d/)).toBeNull();
        expect(screen.getByLabelText('1 set, Squat, best 100kg × 5, show set details')).toBeTruthy();
        fireEvent.press(screen.getByLabelText('1 set, Squat, best 100kg × 5, show set details'));
        expect(screen.getByTestId('exercise-set-details-0')).toBeTruthy();
        expect(screen.getByTestId('exercise-set-details-4')).toBeTruthy();
        fireEvent.press(screen.getByLabelText('1 set, Squat, best 100kg × 5, all sets 100kg × 5, hide set details'));
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        expect(screen.getByTestId('exercise-set-details-4')).toBeTruthy();
        expect(screen.getByLabelText('Repeat Lower II')).toBeTruthy();
        const expandedActionsStyle = StyleSheet.flatten(screen.getByTestId('workout-card-actions').props.style);
        expect(expandedActionsStyle.minHeight).toBe(normalize(48));
        expect(expandedActionsStyle.paddingTop).toBeUndefined();
        expect(expandedActionsStyle.borderTopWidth).toBe(1);
        expect(screen.queryByText('Repeat workout')).toBeNull();

        fireEvent.press(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, all sets 108kg × 12, 10 · 105kg × 9, personal record set 108kg × 12, hide set details'));

        expect(screen.getByText('Calf Raise')).toBeTruthy();
        expect(screen.getByText('Hip Abduction')).toBeTruthy();
        expect(screen.getByText('Leg Press')).toBeTruthy();
        expect(screen.queryByTestId('exercise-set-details-4')).toBeNull();
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        expect(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details')).toBeTruthy();
    });

    it('aligns expanded set details with the total-sets metadata label', () => {
        renderScreen();
        fireEvent(screen.getByLabelText('7 sets'), 'layout', {
            nativeEvent: { layout: { x: 200, y: 0, width: 90, height: 20 } },
        });
        fireEvent(screen.getByText('7 sets'), 'layout', {
            nativeEvent: { layout: { x: 18, y: 0, width: 42, height: 20 } },
        });

        fireEvent.press(screen.getByLabelText('3 sets, Hip Abduction, best 108kg × 12, Personal record, show set details'));

        const row = screen.getByTestId('exercise-row-4');
        const nameColumn = StyleSheet.flatten(row.props.children[1].props.style);
        expect(nameColumn.width).toBe(200 + 18 - spacing[7] - spacing[2] * 2);

        const weightValues = [
            screen.getByTestId('exercise-set-weight-4-0'),
            screen.getByTestId('exercise-set-weight-4-1'),
        ];
        expect(weightValues.map(value => StyleSheet.flatten(value.props.style).width)).toEqual([
            3 * fontSize[12] * 0.62,
            3 * fontSize[12] * 0.62,
        ]);
        expect(weightValues.every(value => StyleSheet.flatten(value.props.style).textAlign === 'right')).toBe(true);
        expect(screen.getByTestId('exercise-set-unit-4-0')).toBeTruthy();
        expect(screen.getByTestId('exercise-set-unit-4-1')).toBeTruthy();
    });

    it('shows all exercises before expanding set details', () => {
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
        expect(screen.getByText('Exercise 9')).toBeTruthy();
        expect(screen.getByLabelText('1 set, Exercise 9, best 20kg × 8, show set details')).toBeTruthy();
    });

    it('shows compact best-set rows while collapsed and all sets when expanded', () => {
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
        expect(screen.getAllByText('trophy')).toHaveLength(1);
        expect(screen.queryByText('PR')).toBeNull();
        expect(screen.getByLabelText('5 sets, Very Long Exercise Name That Must Truncate Before Its PR Icon, best 240kg × 12, Personal record, show set details')).toBeTruthy();
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        fireEvent.press(screen.getByLabelText('5 sets, Very Long Exercise Name That Must Truncate Before Its PR Icon, best 240kg × 12, Personal record, show set details'));
        const setScroller = screen.getByTestId('exercise-set-details-0');
        expect(setScroller.props.horizontal).toBe(true);
        const setText = screen.getByLabelText('Sets: 240kg × 12 · 230kg × 12 · 220kg × 10 · 210kg × 9 · 200kg × 8');
        expect(flattenText(setText.props.children)).toBe(
            '240kg × 12 · 230kg × 12 · 220kg × 10 · 210kg × 9 · 200kg × 8',
        );
        expect(hasPRTextStyle(setText.props.children)).toBe(true);
        expect(screen.queryByTestId('best-set-0')).toBeNull();
        expect(screen.getByLabelText(`Repeat ${longWorkout.workoutName}`)).toBeTruthy();
    });

    it('does not imply a non-best PR set is the best set', () => {
        renderScreenWithWorkout({
            ...workout,
            exercises: [
                exercise('Squat', [
                    { weight: 80, reps: 10, isPR: true },
                    { weight: 100, reps: 5 },
                ]),
            ],
        });

        expect(screen.getByLabelText('2 sets, Squat, best 100kg × 5, show set details')).toBeTruthy();
        expect(StyleSheet.flatten(screen.getByTestId('best-set-0').props.style).color).toBe(colors.text.secondary);
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        fireEvent.press(screen.getByLabelText('2 sets, Squat, best 100kg × 5, show set details'));
        expect(screen.getByLabelText('2 sets, Squat, best 100kg × 5, all sets 80kg × 10 · 100kg × 5, personal record set 80kg × 10, hide set details')).toBeTruthy();
        const setsText = flattenText(screen.getByLabelText('Sets: 80kg × 10 · 100kg × 5').props.children);
        expect(setsText).toBe('80kg × 10 · 100kg × 5');
        expect(setsText).toContain('100kg × 5');
    });

    it('separates mixed weights in the best-set list and details', () => {
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

        expect(screen.getByTestId('best-set-0').props.children).toBe('100kg × 8');
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
        fireEvent.press(screen.getByLabelText('3 sets, Drop Set, best 100kg × 8, show set details'));
        const details = screen.getByTestId('exercise-set-details-0');
        expect(flattenText(screen.getByLabelText('Sets: 100kg × 8 · 90kg × 10, 8').props.children)).toBe('100kg × 8 · 90kg × 10, 8');
        expect(screen.getByLabelText('3 sets, Drop Set, best 100kg × 8, all sets 100kg × 8 · 90kg × 10, 8, personal record set 90kg × 10, hide set details')).toBeTruthy();
        expect(hasPRTextStyle(screen.getByLabelText('Sets: 100kg × 8 · 90kg × 10, 8').props.children)).toBe(true);
    });

    it('shows a single exercise with a per-row set-details control', () => {
        renderScreenWithWorkout({
            ...workout,
            exercises: [exercise('Bench Press', [{ weight: 60, reps: 8 }])],
        });

        expect(screen.getByText('Bench Press')).toBeTruthy();
        expect(screen.getByLabelText('1 exercise')).toBeTruthy();
        expect(screen.queryByText('PR')).toBeNull();
        expect(screen.getByLabelText('1 set, Bench Press, best 60kg × 8, show set details')).toBeTruthy();
        expect(screen.queryByTestId('exercise-set-details-0')).toBeNull();
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
