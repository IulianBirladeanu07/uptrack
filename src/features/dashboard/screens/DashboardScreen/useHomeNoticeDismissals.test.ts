import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeNotice } from '../../../../shared/types';
import { useHomeNoticeDismissals } from './useHomeNoticeDismissals';

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
    },
}));

const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);

describe('useHomeNoticeDismissals', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getItem.mockResolvedValue(null);
        setItem.mockResolvedValue(undefined);
    });

    it('loads the three dismissal values from the signed-in user keys', async () => {
        getItem
            .mockResolvedValueOnce('["adjustment-1", 3]')
            .mockResolvedValueOnce('true')
            .mockResolvedValueOnce('dismissed-at');

        const { result } = renderHook(() => useHomeNoticeDismissals('user-1'));

        await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

        expect(getItem).toHaveBeenNthCalledWith(1, 'home_dismissed_adjustments_user-1');
        expect(getItem).toHaveBeenNthCalledWith(2, 'home_goal_reached_dismissed_user-1');
        expect(getItem).toHaveBeenNthCalledWith(3, 'home_steps_permission_dismissed_user-1');
        expect(result.current).toMatchObject({
            dismissedAdjustments: ['adjustment-1'],
            goalReachedDismissed: true,
            stepsPermissionDismissedAt: 'dismissed-at',
        });
    });

    it('starts with cleared state and marks notices loaded when no user is signed in', async () => {
        const { result } = renderHook(() => useHomeNoticeDismissals(undefined));

        await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

        expect(getItem).not.toHaveBeenCalled();
        expect(result.current).toMatchObject({
            dismissedAdjustments: [],
            goalReachedDismissed: false,
            stepsPermissionDismissedAt: null,
        });
    });

    it('ignores a previous account load when the account changes before storage resolves', async () => {
        const finishFirstLoad: ((value: string | null) => void)[] = [];
        getItem.mockImplementation(key => key.endsWith('user-1')
            ? new Promise(resolve => { finishFirstLoad.push(resolve); })
            : Promise.resolve(key.startsWith('home_dismissed_adjustments_') ? '["user-2"]' : null));

        const { result, rerender } = renderHook(
            ({ uid }) => useHomeNoticeDismissals(uid),
            { initialProps: { uid: 'user-1' as string | undefined } },
        );
        await waitFor(() => expect(finishFirstLoad).toHaveLength(3));
        rerender({ uid: 'user-2' });
        await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

        expect(result.current.dismissedAdjustments).toEqual(['user-2']);
        await act(async () => {
            finishFirstLoad[0]('["user-1"]');
            finishFirstLoad[1](null);
            finishFirstLoad[2](null);
        });
        expect(result.current.dismissedAdjustments).toEqual(['user-2']);
    });

    it('logs invalid adjustment data while still loading the other dismissals', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        getItem.mockResolvedValueOnce('{').mockResolvedValueOnce('true').mockResolvedValueOnce(null);
        try {
            const { result } = renderHook(() => useHomeNoticeDismissals('user-1'));
            await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

            expect(logError).toHaveBeenCalledWith('Invalid persisted home adjustment dismissals.');
            expect(result.current.dismissedAdjustments).toEqual([]);
            expect(result.current.goalReachedDismissed).toBe(true);
        } finally {
            logError.mockRestore();
        }
    });

    it('logs storage read failure and finishes loading with cleared dismissal state', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        getItem.mockRejectedValue(new Error('storage unavailable'));
        try {
            const { result } = renderHook(() => useHomeNoticeDismissals('user-1'));
            await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

            expect(logError).toHaveBeenCalledWith('loadDismissalState error:', expect.any(Error));
            expect(result.current.dismissedAdjustments).toEqual([]);
            expect(result.current.goalReachedDismissed).toBe(false);
            expect(result.current.stepsPermissionDismissedAt).toBeNull();
        } finally {
            logError.mockRestore();
        }
    });

    it('optimistically dismisses each supported notice and persists it for the current user', async () => {
        const { result } = renderHook(() => useHomeNoticeDismissals('user-1'));
        await waitFor(() => expect(result.current.noticesLoaded).toBe(true));
        const adjustment = {
            id: 'adjustment',
            type: 'calorie_adjustment',
            title: 'Adjustment',
            body: 'Dismiss me',
            dismissKey: 'adjustment-2',
        } satisfies HomeNotice;

        await act(async () => {
            await result.current.dismissNotice(adjustment);
            await result.current.dismissNotice({
                id: 'goal',
                type: 'goal_reached',
                title: 'Goal',
                body: 'Dismiss me',
            });
            await result.current.dismissNotice({
                id: 'steps',
                type: 'steps_permission',
                title: 'Steps',
                body: 'Dismiss me',
            });
        });

        expect(result.current.dismissedAdjustments).toEqual(['adjustment-2']);
        expect(result.current.goalReachedDismissed).toBe(true);
        expect(result.current.stepsPermissionDismissedAt).toEqual(expect.any(String));
        expect(setItem).toHaveBeenNthCalledWith(1, 'home_dismissed_adjustments_user-1', '["adjustment-2"]');
        expect(setItem).toHaveBeenNthCalledWith(2, 'home_goal_reached_dismissed_user-1', 'true');
        expect(setItem).toHaveBeenNthCalledWith(
            3,
            'home_steps_permission_dismissed_user-1',
            result.current.stepsPermissionDismissedAt,
        );
    });

    it('does not persist a dismissal without a signed-in user', async () => {
        const { result } = renderHook(() => useHomeNoticeDismissals(undefined));
        await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

        await act(async () => {
            await result.current.dismissNotice({
                id: 'goal',
                type: 'goal_reached',
                title: 'Goal',
                body: 'Dismiss me',
            });
        });

        expect(setItem).not.toHaveBeenCalled();
        expect(result.current.goalReachedDismissed).toBe(false);
    });

    it('logs write failures without reverting the optimistic dismissal', async () => {
        const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
        setItem.mockRejectedValue(new Error('storage unavailable'));
        try {
            const { result } = renderHook(() => useHomeNoticeDismissals('user-1'));
            await waitFor(() => expect(result.current.noticesLoaded).toBe(true));

            await act(async () => {
                await result.current.dismissNotice({
                    id: 'goal',
                    type: 'goal_reached',
                    title: 'Goal',
                    body: 'Dismiss me',
                });
            });

            expect(result.current.goalReachedDismissed).toBe(true);
            expect(logError).toHaveBeenCalledWith('handleDismissNotice error:', expect.any(Error));
        } finally {
            logError.mockRestore();
        }
    });
});
