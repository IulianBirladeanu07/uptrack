import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import BottomNav from './BottomNav';
import { colors } from '../../theme';

const mockNavigate = jest.fn();
const mockState = { current: 'Workout' };

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigationState: (select: (state: { index: number; routes: { name: string }[] }) => string) =>
        select({ index: 0, routes: [{ name: mockState.current }] }),
}));

jest.mock('../../navigation/hooks', () => ({
    useAppNavigation: () => ({ navigate: mockNavigate }),
}));

describe('BottomNav', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockState.current = 'Workout';
    });

    it('exposes each destination as a tab and marks only the current one selected', () => {
        render(<BottomNav />);

        const tabs = screen.getAllByRole('tab');
        expect(tabs.map(tab => tab.props.accessibilityLabel)).toEqual(['Home', 'Workout', 'Nutrition', 'Progress']);
        expect(tabs.map(tab => tab.props.accessibilityState.selected)).toEqual([false, true, false, false]);
    });

    it('navigates to the pressed destination', () => {
        render(<BottomNav />);

        fireEvent.press(screen.getByRole('tab', { name: 'Progress' }));

        expect(mockNavigate).toHaveBeenCalledWith('Progress');
    });

    it('draws inactive labels with the readable tertiary colour', () => {
        render(<BottomNav />);

        const style = StyleSheet.flatten(screen.getByText('Home').props.style);
        expect(style.color).toBe(colors.text.tertiary);
    });
});
