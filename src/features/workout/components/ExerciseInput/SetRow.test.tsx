import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import SetRow from './SetRow';

const mockDeleteSet = jest.fn();
const mockToggleValidation = jest.fn();

jest.mock('react-native-reanimated', () => {
    const { View: MockView } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View: MockView },
        useSharedValue: (initial: unknown) => ({ value: initial }),
        useAnimatedStyle: () => ({}),
        withSpring: (value: unknown) => value,
        runOnJS: (fn: unknown) => fn,
    };
});

jest.mock('react-native-gesture-handler', () => {
    const chain: Record<string, unknown> = {};
    const handler = new Proxy(chain, { get: () => () => handler });
    return {
        Gesture: { Pan: () => handler },
        GestureDetector: ({ children }: { children: unknown }) => children,
    };
});

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({ ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('../../../../shared/services/hapticFeedback', () => ({ triggerImpactFeedback: jest.fn() }));
jest.mock('./PreviousSetDisplay', () => ({ __esModule: true, default: () => null }));
jest.mock('../../services/WorkoutService', () => ({
    workoutService: {
        deleteSet: (...args: unknown[]) => mockDeleteSet(...args),
        toggleValidation: (...args: unknown[]) => mockToggleValidation(...args),
    },
}));

const renderRow = (over: Partial<React.ComponentProps<typeof SetRow>> = {}) =>
    render(
        <SetRow
            setIndex={1}
            exerciseIndex={2}
            totalSetsInExercise={3}
            handlePreviousSetPress={jest.fn()}
            setData={{ weight: '60', reps: '', isValidated: false }}
            {...over}
        />,
    );

describe('SetRow accessibility', () => {
    beforeEach(() => {
        mockDeleteSet.mockClear();
        mockToggleValidation.mockClear();
    });

    it('names each input with its set, field and current value', () => {
        renderRow();

        expect(screen.getByRole('button', { name: 'Set 2 weight, 60' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Set 2 reps, empty' })).toBeTruthy();
    });

    it('exposes the completion control as a checkbox with its state', () => {
        renderRow({ setData: { weight: '60', reps: '8', isValidated: true } });

        const box = screen.getByRole('checkbox', { name: 'Set 2 complete' });
        expect(box.props.accessibilityState).toEqual({ checked: true });
    });

    it('offers a delete action that works without the swipe gesture', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        renderRow({ setData: { weight: '60', reps: '', isValidated: false } });

        const box = screen.getByRole('checkbox', { name: 'Set 2 complete' });
        expect(box.props.accessibilityActions).toEqual([{ name: 'delete', label: 'Delete set' }]);

        act(() => {
            fireEvent(box, 'accessibilityAction', { nativeEvent: { actionName: 'delete' } });
        });

        expect(mockDeleteSet).toHaveBeenCalledWith(2, 1);
        alertSpy.mockRestore();
    });

    it('asks before deleting the last set of an exercise', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        renderRow({ totalSetsInExercise: 1 });

        act(() => {
            fireEvent(screen.getByRole('checkbox', { name: 'Set 2 complete' }), 'accessibilityAction', {
                nativeEvent: { actionName: 'delete' },
            });
        });

        expect(alertSpy).toHaveBeenCalledWith('Delete Exercise', expect.any(String), expect.any(Array));
        expect(mockDeleteSet).not.toHaveBeenCalled();
        alertSpy.mockRestore();
    });
});

describe('SetRow when its exercise changes position', () => {
    beforeEach(() => {
        mockDeleteSet.mockClear();
    });

    it('acts on the new exercise index after the card is moved', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const setData = { weight: '60', reps: '', isValidated: false };
        const onPrevious = jest.fn();
        const props = { setIndex: 1, totalSetsInExercise: 3, handlePreviousSetPress: onPrevious, setData };
        const view = render(<SetRow {...props} exerciseIndex={0} />);

        view.rerender(<SetRow {...props} exerciseIndex={1} />);
        act(() => {
            fireEvent(screen.getByRole('checkbox', { name: 'Set 2 complete' }), 'accessibilityAction', {
                nativeEvent: { actionName: 'delete' },
            });
        });

        expect(mockDeleteSet).toHaveBeenCalledWith(1, 1);
        alertSpy.mockRestore();
    });
});
