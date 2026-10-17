jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));
jest.mock('../helpers/stepsSyncService', () => ({
    ...jest.requireActual('../helpers/stepsSyncService'),
    persistDailySteps: jest.fn(),
}));

import { persistDailySteps } from '../helpers/stepsSyncService';
import { StepsFlusher } from './StepsFlusher';
import type { UserData } from '../../../shared/types';

const persist = persistDailySteps as jest.Mock;

const makeFlusher = (overrides: { uid?: string; userData?: UserData | null; generation?: number } = {}) => {
    const state = {
        uid: 'uid' in overrides ? overrides.uid : 'user-1',
        userData: 'userData' in overrides ? (overrides.userData ?? null) : ({ uid: 'user-1', dailySteps: {} } as UserData),
        generation: overrides.generation ?? 1,
    };
    const flusher = new StepsFlusher({
        getUid: () => state.uid,
        getUserData: () => state.userData,
        getGeneration: () => state.generation,
    });
    return { flusher, state };
};

describe('StepsFlusher', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        persist.mockReset();
        persist.mockResolvedValue(true);
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => errorSpy.mockRestore());

    test('does nothing without queued entries', async () => {
        const { flusher } = makeFlusher();

        await flusher.flush();

        expect(persist).not.toHaveBeenCalled();
    });

    test('merges queued batches into one write', async () => {
        const { flusher } = makeFlusher();
        flusher.queue({ '2026-10-10': 5000 });
        flusher.queue({ '2026-10-11': 6000, '2026-10-10': 5500 });

        await flusher.flush();

        expect(persist).toHaveBeenCalledTimes(1);
        expect(persist).toHaveBeenCalledWith('user-1', { '2026-10-10': 5500, '2026-10-11': 6000 });
    });

    test('keeps entries queued while the uid or user data is missing or mismatched', async () => {
        const { flusher, state } = makeFlusher({ userData: null });
        flusher.queue({ '2026-10-10': 5000 });

        await flusher.flush();
        expect(persist).not.toHaveBeenCalled();

        state.userData = { uid: 'someone-else', dailySteps: {} } as UserData;
        await flusher.flush();
        expect(persist).not.toHaveBeenCalled();

        state.userData = { uid: 'user-1', dailySteps: {} } as UserData;
        await flusher.flush();
        expect(persist).toHaveBeenCalledWith('user-1', { '2026-10-10': 5000 });
    });

    test('drops entries that stored data already covers without writing', async () => {
        const { flusher } = makeFlusher({ userData: { uid: 'user-1', dailySteps: { '2026-10-10': 5000 } } as UserData });
        flusher.queue({ '2026-10-10': 5000, '2026-10-09': 900 });

        await flusher.flush();
        await flusher.flush();

        expect(persist).not.toHaveBeenCalled();
    });

    test('remembers written entries and only writes higher values afterwards', async () => {
        const { flusher } = makeFlusher();
        flusher.queue({ '2026-10-10': 5000 });
        await flusher.flush();

        flusher.queue({ '2026-10-10': 5000 });
        await flusher.flush();
        flusher.queue({ '2026-10-10': 5200 });
        await flusher.flush();

        expect(persist).toHaveBeenCalledTimes(2);
        expect(persist).toHaveBeenLastCalledWith('user-1', { '2026-10-10': 5200 });
    });

    test('puts failed entries back, keeping newer queued values over the failed ones', async () => {
        const { flusher } = makeFlusher();
        let rejectWrite: (error: Error) => void = () => undefined;
        persist.mockImplementationOnce(() => new Promise((_, reject) => { rejectWrite = reject; }));
        flusher.queue({ '2026-10-10': 5000, '2026-10-11': 6000 });

        const first = flusher.flush();
        flusher.queue({ '2026-10-10': 5100 });
        rejectWrite(new Error('offline'));
        await first;
        await flusher.flush();

        expect(errorSpy).toHaveBeenCalledWith('persistDailySteps error:', expect.any(Error));
        expect(persist).toHaveBeenLastCalledWith('user-1', { '2026-10-10': 5100, '2026-10-11': 6000 });
    });

    test('does not start a second write while one is in flight', async () => {
        const { flusher } = makeFlusher();
        let finishWrite: () => void = () => undefined;
        persist.mockImplementationOnce(() => new Promise<boolean>(resolve => { finishWrite = () => resolve(true); }));
        flusher.queue({ '2026-10-10': 5000 });

        const first = flusher.flush();
        flusher.queue({ '2026-10-11': 6000 });
        await flusher.flush();
        expect(persist).toHaveBeenCalledTimes(1);

        finishWrite();
        await first;
        await flusher.flush();

        expect(persist).toHaveBeenCalledTimes(2);
        expect(persist).toHaveBeenLastCalledWith('user-1', { '2026-10-11': 6000 });
    });

    test('ignores the result of a write that finishes after the account changed', async () => {
        const { flusher, state } = makeFlusher();
        let rejectWrite: (error: Error) => void = () => undefined;
        persist.mockImplementationOnce(() => new Promise((_, reject) => { rejectWrite = reject; }));
        flusher.queue({ '2026-10-10': 5000 });

        const first = flusher.flush();
        state.uid = 'user-2';
        state.generation = 2;
        state.userData = { uid: 'user-2', dailySteps: {} } as UserData;
        flusher.reset();
        rejectWrite(new Error('offline'));
        await first;
        await flusher.flush();

        expect(errorSpy).not.toHaveBeenCalled();
        expect(persist).toHaveBeenCalledTimes(1);
    });

    test('reset forgets pending and written entries', async () => {
        const { flusher } = makeFlusher();
        flusher.queue({ '2026-10-10': 5000 });
        await flusher.flush();
        flusher.queue({ '2026-10-11': 6000 });

        flusher.reset();
        await flusher.flush();
        flusher.queue({ '2026-10-10': 5000 });
        await flusher.flush();

        expect(persist).toHaveBeenCalledTimes(2);
        expect(persist).toHaveBeenLastCalledWith('user-1', { '2026-10-10': 5000 });
    });
});
