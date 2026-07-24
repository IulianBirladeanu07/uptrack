import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const consolidateFoodData = (existingFoods, newFoods) => {
    const foods = [...existingFoods];
    newFoods.forEach(newFood => {
        const idx = foods.findIndex(item => item.id === newFood.id);
        if (idx !== -1) {
            const existing = foods[idx];
            foods[idx] = {
                ...existing,
                calories:      (existing.calories      || 0) + (newFood.calories      || 0),
                carbohydrates: (existing.carbohydrates || 0) + (newFood.carbohydrates || 0),
                fats:          (existing.fats          || 0) + (newFood.fats          || 0),
                protein:       (existing.protein       || 0) + (newFood.protein       || 0),
                fiber:         (existing.fiber         || 0) + (newFood.fiber         || 0),
                sugar:         (existing.sugar         || 0) + (newFood.sugar         || 0),
                salt:          (existing.salt          || 0) + (newFood.salt          || 0),
                saturatedFats: (existing.saturatedFats || 0) + (newFood.saturatedFats || 0),
                usageCount:    (existing.usageCount    || 0) + 1,
                quantity:      (existing.quantity      || 0) + (newFood.quantity      || 0),
            };
        } else {
            foods.push({ ...newFood, quantity: newFood.quantity || 1, usageCount: 1 });
        }
    });
    return foods;
};

export const buildAddUndo = (existingFoods, newFoods) => {
    return newFoods.map(newFood => {
        const previous = existingFoods.find(item => item.id === newFood.id) || null;
        return { id: newFood.id, previous };
    });
};

export const applyAddUndo = (currentFoods, undoSpecs) => {
    let result = [...currentFoods];
    undoSpecs.forEach(({ id, previous }) => {
        result = previous
            ? result.map(f => f.id === id ? previous : f)
            : result.filter(f => f.id !== id);
    });
    return result;
};

const dayDocRef = (uid, date) => doc(db, 'meals', `${uid}_${date}`);

export const writeMealType = async (uid, mealType, foods, date) => {
    const ref  = dayDocRef(uid, date);
    const snap = await getDoc(ref);
    const now  = Timestamp.now();

    if (snap.exists()) {
        await updateDoc(ref, { [mealType]: foods, timestamp: now });
        return foods;
    }

    const newDoc = { uid, date, breakfast: [], lunch: [], dinner: [], snacks: [], timestamp: now };
    newDoc[mealType] = foods;
    await setDoc(ref, newDoc);
    return foods;
};

export const fetchMealsForDate = async (uid, date) => {
    const snap = await getDoc(dayDocRef(uid, date));
    if (!snap.exists()) return { breakfast: [], lunch: [], dinner: [], snacks: [] };
    const data = snap.data();
    return {
        breakfast: (data.breakfast || []).map(f => ({ ...f, mealType: 'breakfast', timestamp: data.timestamp })),
        lunch:     (data.lunch     || []).map(f => ({ ...f, mealType: 'lunch',     timestamp: data.timestamp })),
        dinner:    (data.dinner    || []).map(f => ({ ...f, mealType: 'dinner',    timestamp: data.timestamp })),
        snacks:    (data.snacks    || []).map(f => ({ ...f, mealType: 'snacks',    timestamp: data.timestamp })),
    };
};

export const fetchLast30DaysMeals = async (uid) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const q = query(
        collection(db, 'meals'),
        where('uid', '==', uid),
        where('date', '>=', dateStr),
        orderBy('date', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.flatMap(d => {
        const data = d.data();
        return MEAL_TYPES
            .filter(mealType => (data[mealType] || []).length > 0)
            .map(mealType => ({ date: data.date, mealType, foods: data[mealType] }));
    });
};

export const deleteMealItem = async (uid, mealType, foodId, date) => {
    const ref  = dayDocRef(uid, date);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Meal document does not exist');

    const updated = (snap.data()[mealType] || []).filter(f => f.id !== foodId);
    await updateDoc(ref, { [mealType]: updated });
    return updated;
};

export const updateMealItem = async (uid, mealType, foodId, updatedFood, date) => {
    const ref  = dayDocRef(uid, date);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Meal document does not exist');

    const updated = (snap.data()[mealType] || []).map(f =>
        f.id === foodId ? { ...updatedFood, id: foodId, usageCount: f.usageCount || 1 } : f
    );
    await updateDoc(ref, { [mealType]: updated });
    return updated;
};