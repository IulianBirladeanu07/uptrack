import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { switchToMaintenance } from '../../../nutrition/helpers/phaseService';
import type { UserData } from '../../../../shared/types';
import type { PhaseRecap } from '../../utils/progressEngine';
import { useMaintenanceSwitch } from './useMaintenanceSwitch';

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
}));
jest.mock('../../../nutrition/helpers/phaseService', () => ({
    switchToMaintenance: jest.fn(),
}));

const alert = jest.mocked(Alert.alert);
const auth = jest.mocked(getAuth);
const switchPhase = jest.mocked(switchToMaintenance);

const recap: PhaseRecap = {
    type: 'weight_loss',
    tab: 'nutrition',
    dir: -1,
    weeks: 12,
    startDate: new Date(2026, 0, 1),
    startWeight: 90,
    endWeight: 80.4,
    change: -9.6,
    rate: -0.8,
    avgKcal: 1800,
    strengthPct: 3,
    weightPct: -10.7,
    perKg: 15,
    maintenance: 2400,
    maintenanceSource: 'recent',
    avgKcalWeeks: 12,
    avgKcalDays: 84,
};

const userData = { uid: 'user-1' } as UserData;

describe('useMaintenanceSwitch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        switchPhase.mockResolvedValue(undefined);
    });

    it('asks for confirmation before switching and does nothing when cancelled', () => {
        const { result } = renderHook(() => useMaintenanceSwitch({
            recap,
            userData,
            refreshUserData: jest.fn(),
        }));

        act(() => result.current.onSwitch());

        expect(alert).toHaveBeenCalledWith(
            'Switch to maintenance',
            expect.stringContaining('2,400 kcal'),
            expect.any(Array),
        );
        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
        expect(buttons.map(button => button.text)).toEqual(['Cancel', 'Switch']);
        expect(switchPhase).not.toHaveBeenCalled();
    });

    it('switches using the profile uid, refreshes user data, and clears busy state', async () => {
        const refreshUserData = jest.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() => useMaintenanceSwitch({ recap, userData, refreshUserData }));

        act(() => result.current.onSwitch());
        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => Promise<void> }[];
        await act(async () => {
            await buttons[1].onPress?.();
        });

        expect(switchPhase).toHaveBeenCalledWith('user-1', userData, {
            weight: 80.4,
            kcal: 2400,
            entry: expect.objectContaining({
                type: recap.type,
                startWeight: 90,
                endWeight: 80.4,
            }),
        });
        expect(refreshUserData).toHaveBeenCalledTimes(1);
        expect(result.current.switching).toBe(false);
    });

    it('falls back to the authenticated uid and reports failures', async () => {
        auth.mockReturnValue({ currentUser: { uid: 'auth-user' } } as ReturnType<typeof getAuth>);
        switchPhase.mockRejectedValue(new Error('write failed'));
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const { result } = renderHook(() => useMaintenanceSwitch({
                recap,
                userData: {},
                refreshUserData: jest.fn(),
            }));
            act(() => result.current.onSwitch());
            const buttons = alert.mock.calls[0][2] as { onPress?: () => Promise<void> }[];
            await act(async () => {
                await buttons[1].onPress?.();
            });

            expect(switchPhase).toHaveBeenCalledWith('auth-user', {}, expect.any(Object));
            expect(alert).toHaveBeenLastCalledWith('Error', 'Failed to switch. Try again.');
            expect(logError).toHaveBeenCalledWith('Progress switch error:', 'write failed');
            expect(result.current.switching).toBe(false);
        } finally {
            logError.mockRestore();
        }
    });

    it('does not prompt when recap is unavailable or maintenance cannot be calculated', () => {
        const { result, rerender } = renderHook(
            ({ model }) => useMaintenanceSwitch({ recap: model, userData, refreshUserData: jest.fn() }),
            { initialProps: { model: null as PhaseRecap | null } },
        );

        act(() => result.current.onSwitch());
        rerender({ model: { ...recap, maintenance: null } });
        act(() => result.current.onSwitch());

        expect(alert).not.toHaveBeenCalled();
    });

    it('does not open duplicate confirmations while a switch is in progress', async () => {
        let finishSwitch: () => void = () => {};
        switchPhase.mockReturnValue(new Promise(resolve => { finishSwitch = resolve; }));
        const { result } = renderHook(() => useMaintenanceSwitch({
            recap,
            userData,
            refreshUserData: jest.fn(),
        }));

        act(() => result.current.onSwitch());
        const buttons = alert.mock.calls[0][2] as { onPress?: () => Promise<void> }[];
        let pending: Promise<void> | undefined;
        await act(async () => {
            pending = buttons[1].onPress?.();
        });
        await waitFor(() => expect(result.current.switching).toBe(true));

        act(() => result.current.onSwitch());
        expect(alert).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishSwitch();
            await pending;
        });
        expect(result.current.switching).toBe(false);
    });
});
