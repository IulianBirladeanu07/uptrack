import { doc, setDoc, getDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { formatDate } from '../utils/dateUtils';
import { mealDayConverter } from '../../../shared/firestore/converters';
import type { DateInput, LoggedFood, MealDayDoc, MealGroup, MealType, MealsByType } from '../../../shared/types';
import { queryClient } from '../../../shared/query/queryClient';

type AddUndoSpec = { id: string; previous: LoggedFood | null };

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const mealHistoryQueryKey = {
    root: (uid: string) => ['meal-history', uid] as const,
    day: (uid: string, date: string) => ['meal-history', uid, 'day', date] as const,
    range: (uid: string, start: string, end: string, direction: 'asc' | 'desc') =>
        ['meal-history', uid, 'range', start, end, direction] as const,
};

const num = (v: unknown): number => Number(v) || 0;

const isRecord = (food: unknown): food is Record<string, unknown> =>
    food !== null && typeof food === 'object' && !Array.isArray(food);

const isLoggedFood = (food: unknown): food is LoggedFood =>
    isRecord(food) && typeof food['id'] === 'string';

export const normalizeLoggedFoods = (foods: unknown): LoggedFood[] =>
    Array.isArray(foods) ? foods.filter(isLoggedFood) : [];

export const consolidateFoodData = (existingFoods: LoggedFood[], newFoods: LoggedFood[]): LoggedFood[] => {
    const foods = [...existingFoods];
    newFoods.forEach(newFood => {
        const idx = foods.findIndex(item => item.id === newFood.id);
        if (idx !== -1) {
            const existing = foods[idx];
            foods[idx] = {
                ...existing,
                calories:      num(existing.calories)      + num(newFood.calories),
                carbohydrates: num(existing.carbohydrates) + num(newFood.carbohydrates),
                fats:          num(existing.fats)          + num(newFood.fats),
                protein:       num(existing.protein)       + num(newFood.protein),
                fiber:         num(existing.fiber)         + num(newFood.fiber),
                sugar:         num(existing.sugar)         + num(newFood.sugar),
                salt:          num(existing.salt)          + num(newFood.salt),
                saturatedFats: num(existing.saturatedFats) + num(newFood.saturatedFats),
                usageCount:    (existing.usageCount    || 0) + 1,
                quantity:      num(existing.quantity)      + num(newFood.quantity),
            };
        } else {
            foods.push({ ...newFood, quantity: newFood.quantity || 1, usageCount: 1 });
        }
    });
    return foods;
};

export const buildAddUndo = (existingFoods: LoggedFood[], newFoods: LoggedFood[]): AddUndoSpec[] => {
    return newFoods.map(newFood => {
        const previous = existingFoods.find(item => item.id === newFood.id) || null;
        return { id: newFood.id, previous };
    });
};

export const applyAddUndo = (currentFoods: LoggedFood[], undoSpecs: AddUndoSpec[]): LoggedFood[] => {
    let result = [...currentFoods];
    undoSpecs.forEach(({ id, previous }) => {
        result = previous
            ? result.map(f => f.id === id ? previous : f)
            : result.filter(f => f.id !== id);
    });
    return result;
};

const dayDocRef = (uid: string, date: string) =>
    doc(db, 'meals', `${uid}_${date}`).withConverter(mealDayConverter);

const mealsCollection = () => collection(db, 'meals').withConverter(mealDayConverter);

export const writeMealType = async (uid: string, mealType: MealType, foods: LoggedFood[], date: string): Promise<LoggedFood[]> => {
    const data: MealDayDoc = { uid, date, timestamp: Timestamp.now() };
    data[mealType] = foods;
    await setDoc(dayDocRef(uid, date), data, { merge: true });
    await queryClient.invalidateQueries({
        queryKey: mealHistoryQueryKey.root(uid),
        refetchType: 'none',
    });
    return foods;
};

const loadRawMealsForDate = async (uid: string, date: string): Promise<MealsByType> => {
    const snap = await getDoc(dayDocRef(uid, date));
    const data: Partial<MealsByType> = snap.exists() ? (snap.data() ?? {}) : {};
    return {
        breakfast: normalizeLoggedFoods(data.breakfast),
        lunch:     normalizeLoggedFoods(data.lunch),
        dinner:    normalizeLoggedFoods(data.dinner),
        snacks:    normalizeLoggedFoods(data.snacks),
    };
};

export const fetchRawMealsForDate = (uid: string, date: string): Promise<MealsByType> =>
    queryClient.fetchQuery({
        queryKey: mealHistoryQueryKey.day(uid, date),
        queryFn: () => loadRawMealsForDate(uid, date),
        staleTime: 0,
        retry: false,
    });

const loadMealsForDateRange = async (
    uid: string,
    startDate: DateInput,
    endDate: DateInput,
    direction: 'asc' | 'desc' = 'asc',
): Promise<MealGroup[]> => {
    const q = query(
        mealsCollection(),
        where('uid', '==', uid),
        where('date', '>=', formatDate(startDate)),
        where('date', '<=', formatDate(endDate)),
        orderBy('date', direction)
    );

    const snap = await getDocs(q);
    return snap.docs.flatMap(d => {
        const data = d.data();
        return MEAL_TYPES.flatMap(mealType => {
            const foods = normalizeLoggedFoods(data[mealType]);
            return foods.length > 0 ? [{ date: data.date, mealType, foods }] : [];
        });
    });
};

export const fetchMealsForDateRange = (
    uid: string,
    startDate: DateInput,
    endDate: DateInput,
    direction: 'asc' | 'desc' = 'asc',
): Promise<MealGroup[]> => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return queryClient.fetchQuery({
        queryKey: mealHistoryQueryKey.range(uid, start, end, direction),
        queryFn: () => loadMealsForDateRange(uid, startDate, endDate, direction),
        staleTime: 0,
        retry: false,
    });
};

export const fetchLast30DaysMeals = async (uid: string): Promise<MealGroup[]> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return fetchMealsForDateRange(uid, thirtyDaysAgo, new Date(), 'desc');
};

export const fetchNutritionForDateRange = async (
    uid: string,
    startDate: DateInput,
    endDate: DateInput,
): Promise<{ date: string; calories: number; protein: number }[]> => {
    const meals = await fetchMealsForDateRange(uid, startDate, endDate);
    const totals = new Map<string, { calories: number; protein: number }>();
    meals.forEach(({ date, foods }) => {
        const day = totals.get(date) ?? { calories: 0, protein: 0 };
        foods.forEach(food => {
            day.calories += num(food.calories);
            day.protein += num(food.protein);
        });
        totals.set(date, day);
    });
    return [...totals].map(([date, values]) => ({ date, ...values }));
};
