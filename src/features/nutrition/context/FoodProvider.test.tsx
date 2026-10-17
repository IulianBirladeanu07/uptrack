import React from 'react';
import { Alert } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockAuthState: { callback: ((user: { uid: string } | null) => void) | null } = { callback: null };

jest.mock('firebase/auth', () => ({
    onAuthStateChanged: jest.fn((_auth: unknown, callback: (user: { uid: string } | null) => void) => {
        mockAuthState.callback = callback;
        return jest.fn();
    }),
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
    doc: jest.fn(() => ({ withConverter: jest.fn(() => ({})) })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    orderBy: jest.fn(() => ({})),
    query: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    Timestamp: { now: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn().mockResolvedValue(undefined),
        removeItem: jest.fn().mockResolvedValue(undefined),
        multiRemove: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../../auth/services/firebaseConfigService', () => ({ auth: {}, db: {} }));

jest.mock('../../auth/context/AuthContext', () => {
    const { createContext } = jest.requireActual('react');
    return { AuthContext: createContext(undefined) };
});

jest.mock('../../../shared/components/StepDisplay/StepDisplay', () => {
    const { forwardRef } = jest.requireActual('react');
    return { __esModule: true, default: forwardRef(() => null) };
});

jest.mock('../services/mealService', () => ({
    ...jest.requireActual('../services/mealService'),
    fetchLast30DaysMeals: jest.fn(),
    fetchRawMealsForDate: jest.fn(),
    writeMealType: jest.fn(),
}));

jest.mock('./cache/mealCacheStorage', () => ({
    clearPersistedMealCache: jest.fn(),
    loadPersistedMealCache: jest.fn(),
    persistMealCache: jest.fn(),
}));

jest.mock('../helpers/learningCompletionService', () => ({
    ...jest.requireActual('../helpers/learningCompletionService'),
    checkAndCompleteLearning: jest.fn().mockResolvedValue(null),
    calculateLearningStats: jest.fn(() => ({ daysLogged: 0, averages: { calories: 0 }, isComplete: false })),
    checkAndRunWeeklyEval: jest.fn().mockResolvedValue(null),
    checkAndBackfillStepsBonus: jest.fn().mockResolvedValue(null),
}));

jest.mock('../helpers/stepsSyncService', () => ({
    ...jest.requireActual('../helpers/stepsSyncService'),
    persistDailySteps: jest.fn().mockResolvedValue(undefined),
}));

import { AuthContext } from '../../auth/context/AuthContext';
import { fetchLast30DaysMeals, fetchRawMealsForDate, writeMealType } from '../services/mealService';
import { loadPersistedMealCache, persistMealCache } from './cache/mealCacheStorage';
import { formatDate } from '../utils/dateUtils';
import { FoodProvider, useFoodContext } from './FoodContext';
import type { LoggedFood } from '../../../shared/types';

const emptyDay = { breakfast: [], lunch: [], dinner: [], snacks: [] };
const today = formatDate(new Date());
const oats: LoggedFood = { id: 'oats', productName: 'Oats', calories: 100, protein: 5, carbohydrates: 20, fats: 2, quantity: 1 };
const rice: LoggedFood = { id: 'rice', productName: 'Rice', calories: 200, protein: 4, carbohydrates: 44, fats: 1, quantity: 1 };

const authValue = {
    authenticated: true,
    loading: false,
    userData: null,
    setAuthenticated: jest.fn(),
    profileSetupComplete: true,
    setProfileSetupComplete: jest.fn(),
    logout: jest.fn(),
    refreshUserData: jest.fn().mockResolvedValue(undefined),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={authValue}>
        <FoodProvider>{children}</FoodProvider>
    </AuthContext.Provider>
);

const signIn = async (uid = 'user-1') => {
    await act(async () => {
        mockAuthState.callback?.({ uid });
    });
};

const setup = async () => {
    const hook = renderHook(() => useFoodContext(), { wrapper });
    await signIn();
    await waitFor(() => expect(hook.result.current.initialLoadComplete).toBe(true));
    return hook;
};

const lastWrite = () => {
    const calls = (writeMealType as jest.Mock).mock.calls;
    return calls[calls.length - 1];
};

describe('FoodProvider meal writes', () => {
    let alertSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthState.callback = null;
        (loadPersistedMealCache as jest.Mock).mockResolvedValue(null);
        (fetchLast30DaysMeals as jest.Mock).mockResolvedValue([]);
        (fetchRawMealsForDate as jest.Mock).mockResolvedValue({ ...emptyDay });
        (writeMealType as jest.Mock).mockResolvedValue([]);
        alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(async () => {
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
        });
        alertSpy.mockRestore();
        errorSpy.mockRestore();
    });

    test('adding a meal writes the consolidated foods for the selected day and updates state', async () => {
        const { result } = await setup();

        let returned: LoggedFood[] = [];
        await act(async () => {
            returned = await result.current.handleAddMeal('lunch', [oats]);
        });

        expect(returned).toEqual([{ ...oats, usageCount: 1 }]);
        expect(writeMealType).toHaveBeenCalledWith('user-1', 'lunch', returned, today);
        expect(result.current.lunchFoods).toEqual(returned);
        expect(persistMealCache).toHaveBeenLastCalledWith('user-1', expect.arrayContaining([
            expect.objectContaining({ date: today, mealType: 'lunch', foods: returned }),
        ]));
        expect(alertSpy).not.toHaveBeenCalled();
    });

    test('adding the same food twice consolidates quantities and usage count', async () => {
        const { result } = await setup();

        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });

        expect(result.current.lunchFoods).toHaveLength(1);
        expect(result.current.lunchFoods[0]).toMatchObject({ id: 'oats', calories: 200, quantity: 2, usageCount: 2 });
    });

    test('simultaneous adds to one meal are serialized and neither is lost', async () => {
        const { result } = await setup();

        await act(async () => {
            await Promise.all([
                result.current.handleAddMeal('dinner', [oats]),
                result.current.handleAddMeal('dinner', [rice]),
            ]);
        });

        expect(result.current.dinnerFoods.map(f => f.id)).toEqual(['oats', 'rice']);
        expect(lastWrite()[2].map((f: LoggedFood) => f.id)).toEqual(['oats', 'rice']);
    });

    test('a failed add rolls back, alerts, and sets the error message', async () => {
        const { result } = await setup();
        (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        await act(async () => {
            await expect(result.current.handleAddMeal('lunch', [oats])).rejects.toThrow('offline');
        });

        expect(result.current.lunchFoods).toEqual([]);
        expect(alertSpy).toHaveBeenCalledWith("Couldn't save", 'Check your connection and try again.');
        expect(result.current.error).toBe('Failed to add meal. Please try again.');
    });

    test('a failed add on top of an existing food restores the previous entry', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        const before = result.current.lunchFoods;
        (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        await act(async () => {
            await expect(result.current.handleAddMeal('lunch', [oats, rice])).rejects.toThrow('offline');
        });

        expect(result.current.lunchFoods).toEqual(before);
    });

    test('add rejects invalid parameters without alerting or writing', async () => {
        const { result } = await setup();

        await act(async () => {
            await expect(result.current.handleAddMeal('lunch', [])).rejects.toThrow('Invalid meal parameters');
        });

        expect(writeMealType).not.toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalled();
    });

    test('add reports a failed day load and does not write', async () => {
        const { result } = await setup();
        (fetchRawMealsForDate as jest.Mock).mockRejectedValueOnce(new Error('read failed'));

        await act(async () => {
            await expect(result.current.handleAddMeal('lunch', [oats])).rejects.toThrow('read failed');
        });

        expect(writeMealType).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith("Couldn't save", 'Check your connection and try again.');
        expect(result.current.error).toBe('Failed to load meals. Please try again.');
    });

    test('deleting a food writes the remaining foods and returns true', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats, rice]);
        });

        let deleted = false;
        await act(async () => {
            deleted = await result.current.handleDeleteMeal('lunch', 'oats');
        });

        expect(deleted).toBe(true);
        expect(result.current.lunchFoods.map(f => f.id)).toEqual(['rice']);
        expect(lastWrite()[2].map((f: LoggedFood) => f.id)).toEqual(['rice']);
    });

    test('deleting an unknown food or with missing arguments returns false without writing', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        (writeMealType as jest.Mock).mockClear();

        let unknown = true;
        let missing = true;
        await act(async () => {
            unknown = await result.current.handleDeleteMeal('lunch', 'nope');
            missing = await result.current.handleDeleteMeal('lunch', '');
        });

        expect(unknown).toBe(false);
        expect(missing).toBe(false);
        expect(writeMealType).not.toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalled();
    });

    test('a failed delete restores the food, alerts, and returns false', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        let deleted = true;
        await act(async () => {
            deleted = await result.current.handleDeleteMeal('lunch', 'oats');
        });

        expect(deleted).toBe(false);
        expect(result.current.lunchFoods.map(f => f.id)).toEqual(['oats']);
        expect(alertSpy).toHaveBeenCalledWith("Couldn't save", 'Check your connection and try again.');
        expect(result.current.error).toBe('Failed to delete meal item. Please try again.');
    });

    test('updating a food replaces its details, keeps its id and usage count, and writes', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });

        await act(async () => {
            await result.current.updateMealInDatabase('lunch', 'oats', { ...oats, id: 'ignored', calories: 350, quantity: 3 });
        });

        expect(result.current.lunchFoods).toEqual([{ ...oats, id: 'oats', calories: 350, quantity: 3, usageCount: 2 }]);
        expect(lastWrite()[2]).toEqual(result.current.lunchFoods);
    });

    test('updating an unknown food rejects, alerts, and does not write', async () => {
        const { result } = await setup();
        (writeMealType as jest.Mock).mockClear();

        await act(async () => {
            await expect(result.current.updateMealInDatabase('lunch', 'nope', oats)).rejects.toThrow('Food item not found');
        });

        expect(writeMealType).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith("Couldn't save", 'Check your connection and try again.');
        expect(result.current.error).toBe('Failed to update meal item. Please try again.');
    });

    test('a failed update restores the previous food', async () => {
        const { result } = await setup();
        await act(async () => {
            await result.current.handleAddMeal('lunch', [oats]);
        });
        const before = result.current.lunchFoods;
        (writeMealType as jest.Mock).mockRejectedValueOnce(new Error('offline'));

        await act(async () => {
            await expect(result.current.updateMealInDatabase('lunch', 'oats', { ...oats, calories: 999 })).rejects.toThrow('offline');
        });

        expect(result.current.lunchFoods).toEqual(before);
    });

    test('a write that fails after the account changed does not alert or set an error for the new account', async () => {
        const { result } = await setup();
        let rejectWrite: (error: Error) => void = () => undefined;
        (writeMealType as jest.Mock).mockImplementationOnce(() => new Promise((_, reject) => { rejectWrite = reject; }));

        let outcome: Promise<unknown> = Promise.resolve();
        await act(async () => {
            outcome = result.current.handleAddMeal('lunch', [oats]).catch((e: Error) => e);
        });
        await signIn('user-2');
        await act(async () => {
            rejectWrite(new Error('offline'));
            await outcome;
        });

        expect(alertSpy).not.toHaveBeenCalled();
        expect(result.current.error).toBeNull();
        expect(result.current.lunchFoods).toEqual([]);
    });

    test('mutations are rejected when nobody is signed in', async () => {
        const hook = renderHook(() => useFoodContext(), { wrapper });

        await act(async () => {
            await expect(hook.result.current.handleAddMeal('lunch', [oats])).rejects.toThrow('Invalid meal parameters');
            await expect(hook.result.current.updateMealInDatabase('lunch', 'oats', oats)).rejects.toThrow('Invalid update parameters');
            expect(await hook.result.current.handleDeleteMeal('lunch', 'oats')).toBe(false);
        });

        expect(writeMealType).not.toHaveBeenCalled();
    });
});
