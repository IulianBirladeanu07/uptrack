import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import NutritionScreen from './NutritionScreen';

const initializationError = 'Unable to load nutrition data. Check your connection and try again.';
let mockInitialLoadComplete = false;
let mockInitializationError: string | null = initializationError;

const mockFoodContext = {
    breakfastFoods: [],
    lunchFoods: [],
    dinnerFoods: [],
    snacksFoods: [],
    handleDeleteMeal: jest.fn(),
    selectedDate: new Date('2026-10-16T12:00:00.000Z'),
    setSelectedDate: jest.fn(),
    remainingCalories: 0,
    dailyNutrition: {},
    userMacros: {},
    get initialLoadComplete() {
        return mockInitialLoadComplete;
    },
    get initializationError() {
        return mockInitializationError;
    },
    retryInitialization: jest.fn(),
    hasTargets: false,
    learningData: {},
    dailySteps: 0,
};

const mockNavigation = {
    addListener: jest.fn(() => jest.fn()),
    setParams: jest.fn(),
    navigate: jest.fn(),
};

jest.mock('firebase/auth', () => ({
    getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}));

jest.mock('../../context/FoodContext', () => ({
    useFoodContext: () => mockFoodContext,
}));

jest.mock('../../../../shared/navigation', () => ({
    useAppNavigation: () => mockNavigation,
    useAppRoute: () => ({ params: undefined }),
}));

jest.mock('../../../../shared/components/ApplicationCustomScreen/ApplicationCustomScreen', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../../shared/components/BottomNav/BottomNav', () => ({
    __esModule: true,
    default: () => null,
    useBottomNavInset: () => 0,
}));

jest.mock('../../components/NutritionItem/MealContainer', () => ({
    __esModule: true,
    default: () => {
        const React = require('react');
        const { Text } = require('react-native');
        return React.createElement(Text, null, 'Meals rendered');
    },
}));

jest.mock('../../helpers/useLearningCompletion', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../helpers/useWeightData', () => ({
    __esModule: true,
    default: () => ({ weightData: {}, refreshWeightData: jest.fn() }),
}));

jest.mock('../../components/DateNavigationHeader/DateNavigationHeader', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../../components/NutritionStats/NutritionStats', () => ({
    __esModule: true,
    default: () => null,
}));

describe('NutritionScreen initialization recovery', () => {
    beforeEach(() => {
        mockFoodContext.retryInitialization.mockClear();
        mockInitialLoadComplete = false;
        mockInitializationError = initializationError;
        mockNavigation.addListener.mockClear();
    });

    it('retries after an initialization error and displays meals after recovery', async () => {
        const { rerender } = render(<NutritionScreen />);

        expect(screen.getByText(initializationError)).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

        expect(mockFoodContext.retryInitialization).toHaveBeenCalledTimes(1);

        mockInitializationError = null;
        mockInitialLoadComplete = true;
        rerender(<NutritionScreen />);

        expect(await screen.findByText('Meals rendered')).toBeTruthy();
    });
});
