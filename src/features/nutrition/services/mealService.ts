import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { formatDate } from '../utils/dateUtils';
import { mealDayConverter } from '../../../shared/firestore/converters';
import type { LoggedFood, MealDayDoc, MealGroup, MealType, MealsByType } from '../../../shared/types';

type AddUndoSpec = { id: string; previous: LoggedFood | null };

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

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
    const ref  = dayDocRef(uid, date);
    const snap = await getDoc(ref);
    const now  = Timestamp.now();

    if (snap.exists()) {
        await updateDoc(ref, { [mealType]: foods, timestamp: now });
        return foods;
    }

    const newDoc: MealDayDoc = { uid, date, breakfast: [], lunch: [], dinner: [], snacks: [], timestamp: now };
    newDoc[mealType] = foods;
    await setDoc(ref, newDoc);
    return foods;
};

export const fetchRawMealsForDate = async (uid: string, date: string): Promise<MealsByType> => {
    const snap = await getDoc(dayDocRef(uid, date));
    const data: Partial<MealsByType> = snap.exists() ? (snap.data() ?? {}) : {};
    return {
        breakfast: normalizeLoggedFoods(data.breakfast),
        lunch:     normalizeLoggedFoods(data.lunch),
        dinner:    normalizeLoggedFoods(data.dinner),
        snacks:    normalizeLoggedFoods(data.snacks),
    };
};

export const fetchLast30DaysMeals = async (uid: string): Promise<MealGroup[]> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = formatDate(thirtyDaysAgo);

    const q = query(
        mealsCollection(),
        where('uid', '==', uid),
        where('date', '>=', dateStr),
        orderBy('date', 'desc')
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
