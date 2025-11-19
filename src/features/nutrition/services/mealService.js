// ===== services/mealService.js =====
import { doc, setDoc, deleteDoc, getDoc, updateDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';

const consolidateFoodData = (existingFoods, newFoods) => {
  const foods = [...existingFoods];
  
  newFoods.forEach(newFood => {
    const foodIndex = foods.findIndex(item => item.id === newFood.id);
    
    if (foodIndex !== -1) {
      const existing = foods[foodIndex];
      foods[foodIndex] = {
        ...existing,
        calories: (existing.calories || 0) + (newFood.calories || 0),
        carbohydrates: (existing.carbohydrates || 0) + (newFood.carbohydrates || 0),
        fats: (existing.fats || 0) + (newFood.fats || 0),
        protein: (existing.protein || 0) + (newFood.protein || 0),
        fiber: (existing.fiber || 0) + (newFood.fiber || 0),
        sugar: (existing.sugar || 0) + (newFood.sugar || 0),
        salt: (existing.salt || 0) + (newFood.salt || 0),
        saturatedFats: (existing.saturatedFats || 0) + (newFood.saturatedFats || 0),
        usageCount: (existing.usageCount || 0) + 1,
        quantity: (existing.quantity || 0) + (newFood.quantity || 0)
      };
    } else {
      foods.push({ ...newFood, quantity: newFood.quantity || 1, usageCount: 1 });
    }
  });
  
  return foods;
};

export const fetchMealsForDate = async (uid, date, mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks']) => {
  const meals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  
  const fetchPromises = mealTypes.map(async mealType => {
    const mealDocRef = doc(db, 'meals', `${date}_${mealType}_${uid}`);
    const mealDocSnap = await getDoc(mealDocRef);
    if (mealDocSnap.exists()) {
      const data = mealDocSnap.data();
      meals[mealType] = data.foods.map(food => ({ 
        ...food, 
        mealType, 
        timestamp: data.timestamp 
      }));
    }
  });

  await Promise.all(fetchPromises);
  return meals;
};

export const fetchLast30DaysMeals = async (uid) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const formatDate = (date) => {
    return (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
  };
  
  const mealsQuery = query(
    collection(db, 'meals'),
    where('uid', '==', uid),
    where('date', '>=', formatDate(thirtyDaysAgo)),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(mealsQuery);
  const data = querySnapshot.docs.map(doc => doc.data());
  
  return data;
};

export const addMeal = async (uid, mealType, foods, date) => {
  const foodTimestamp = Timestamp.now();
  const mealDocRef = doc(db, 'meals', `${date}_${mealType}_${uid}`);
  const mealDocSnap = await getDoc(mealDocRef);

  let existingMealData = {
    foods: [],
    date,
    uid,
    mealType,
    timestamp: foodTimestamp,
  };
  
  if (mealDocSnap.exists()) {
    existingMealData = mealDocSnap.data();
    if (!existingMealData.timestamp?.seconds) {
      existingMealData.timestamp = foodTimestamp;
    }
  }

  const consolidatedFoods = consolidateFoodData([...existingMealData.foods], foods);
  
  await setDoc(mealDocRef, {
    ...existingMealData,
    foods: consolidatedFoods,
    timestamp: foodTimestamp,
  });

  return consolidatedFoods;
};

export const deleteMealItem = async (uid, mealType, foodId, date) => {
  const mealDocRef = doc(db, 'meals', `${date}_${mealType}_${uid}`);
  const mealDocSnap = await getDoc(mealDocRef);

  if (!mealDocSnap.exists()) {
    throw new Error('Meal document does not exist');
  }

  const mealData = mealDocSnap.data();
  const updatedFoods = mealData.foods.filter(food => food.id !== foodId);

  if (updatedFoods.length > 0) {
    await updateDoc(mealDocRef, { foods: updatedFoods });
  } else {
    await deleteDoc(mealDocRef);
  }
  
  return updatedFoods;
};

export const updateMealItem = async (uid, mealType, foodId, updatedFoodDetails, date) => {
  const mealDocRef = doc(db, 'meals', `${date}_${mealType}_${uid}`);
  const mealDocSnap = await getDoc(mealDocRef);
  
  if (!mealDocSnap.exists()) {
    throw new Error('Meal document does not exist');
  }

  const mealData = mealDocSnap.data();
  const updatedFoods = mealData.foods.map(food =>
    food.id === foodId 
      ? { ...updatedFoodDetails, id: foodId, usageCount: food.usageCount || 1 } 
      : food
  );

  await updateDoc(mealDocRef, { foods: updatedFoods });
  return updatedFoods;
};
