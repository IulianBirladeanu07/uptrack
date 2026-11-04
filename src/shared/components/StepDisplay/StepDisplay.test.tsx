import React, { createRef } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import type { StepDisplayHandle } from './StepDisplay';
import { ensureStepsAccess, readDailySteps } from '../../services/healthConnectSteps';

jest.mock('../../services/healthConnectSteps', () => ({
    ensureStepsAccess: jest.fn(),
    readDailySteps: jest.fn(),
    openAccessHelp: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() },
}));

jest.mock('firebase/auth', () => ({
    getAuth: () => ({ currentUser: { uid: 'user-1' } }),
}));

const checkAccess = jest.mocked(ensureStepsAccess);
const readSteps = jest.mocked(readDailySteps);
Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
const { default: StepDisplay } = require('./StepDisplay') as typeof import('./StepDisplay');

describe('StepDisplay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkAccess.mockResolvedValue('ready');
        readSteps.mockResolvedValue({});
    });

    it('re-reads recent history when manually retried after initialization', async () => {
        const ref = createRef<StepDisplayHandle>();
        const onStepsHistory = jest.fn();
        const onStepsLoading = jest.fn();
        const onConnectedChange = jest.fn();
        const { unmount } = render(
            <StepDisplay
                ref={ref}
                onStepsHistory={onStepsHistory}
                onStepsLoading={onStepsLoading}
                onConnectedChange={onConnectedChange}
            />,
        );

        await waitFor(() => expect(onStepsHistory).toHaveBeenCalledTimes(1), { timeout: 3000 });
        expect(checkAccess).toHaveBeenCalledWith({ request: false });

        await act(async () => {
            ref.current?.retry();
        });

        await waitFor(() => expect(onStepsHistory).toHaveBeenCalledTimes(2));
        expect(checkAccess).toHaveBeenLastCalledWith({ request: false });
        expect(onConnectedChange).toHaveBeenLastCalledWith(true);
        expect(onStepsLoading).toHaveBeenLastCalledWith(false);
        unmount();
    });
});
