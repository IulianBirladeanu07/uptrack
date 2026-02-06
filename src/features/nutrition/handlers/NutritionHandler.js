import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs, } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../shared/services/supabaseClient'
import { Timestamp } from 'firebase/firestore';

export const fetchFrequentFoods = async (limitCount = 50) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated.');
    }

    const cacheKey = `frequentFoods_${user.uid}`;
    const cachedFoods = await handleCache.get(cacheKey);
    if (cachedFoods) {
      return cachedFoods;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];
    
    const mealQuery = query(
      collection(db, 'meals'),
      where('uid', '==', user.uid),
      where('date', '>=', thirtyDaysAgoString),
      orderBy('date', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(mealQuery);
    const foodUsageMap = new Map();

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const foods = data.foods || [];
      const mealType = doc.id.split('_')[1];
      const firestoreTimestamp = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds);
      const mealDate = firestoreTimestamp.toDate().getTime();

      foods.forEach(food => {
        const foodKey = `${food.id}_${mealType}`;
        if (!foodUsageMap.has(foodKey)) {
          foodUsageMap.set(foodKey, {
            ...food,
            mealType,
            usageCount: 0,
            lastUsed: mealDate
          });
        }
        const existingFood = foodUsageMap.get(foodKey);
        existingFood.usageCount += 1;
        if (mealDate > existingFood.lastUsed) {
          existingFood.lastUsed = mealDate;
        }
      });
    });

    const frequentFoods = Array.from(foodUsageMap.values())
      .sort((a, b) => {
        const recencyScore = (b.lastUsed - a.lastUsed) / (1000 * 60 * 60 * 24);
        const frequencyScore = b.usageCount - a.usageCount;
        return (frequencyScore * 0.7) + (recencyScore * 0.3);
      })
      .slice(0, limitCount);

    await handleCache.set(cacheKey, frequentFoods);
    return frequentFoods;
  } catch (error) {
    console.error("Error fetching frequent foods:", error);
    throw error;
  }
};

const handleCache = {
  async get(key) {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  },

  async set(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }
};

export const fetchRecentMeals = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated.');
    }

    const cacheKey = `recentMeals_${user.uid}`;
    const cachedMeals = await handleCache.get(cacheKey);
    if (cachedMeals) {
      return cachedMeals;
    }

    const mealQuery = query(
      collection(db, 'meals'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(10)
    );

    const mealQuerySnapshot = await getDocs(mealQuery);

    const meals = mealQuerySnapshot.docs.map(doc => {
      const mealData = { id: doc.id, ...doc.data() };
      const foods = mealData.foods || [];
      const totalCalories = foods.reduce((total, food) => 
        total + (Number(food.calories) || 0), 0);

      return {
        ...mealData,
        foods,
        totalCalories
      };
    });

    await handleCache.set(cacheKey, meals);
    return meals;
  } catch (error) {
    console.error("Error fetching recent meals:", error);
    throw error;
  }
};

export const fetchNonBarcodedProducts = async (
  filters = [], 
  order = null, 
  limitCount = 20000, 
  lastVisibleDoc = null, 
  searchQuery = null
) => {
  try {
    if (searchQuery && searchQuery.trim()) {
      return await performEnhancedSearch(searchQuery.trim(), limitCount);
    }

    let queryBuilder = supabase.from('non_barcoded_products').select('*');

    filters.forEach(([field, operator, value]) => {
      switch (operator) {
        case '==': queryBuilder = queryBuilder.eq(field, value); break;
        case '!=': queryBuilder = queryBuilder.neq(field, value); break;
        case '>': queryBuilder = queryBuilder.gt(field, value); break;
        case '>=': queryBuilder = queryBuilder.gte(field, value); break;
        case '<': queryBuilder = queryBuilder.lt(field, value); break;
        case '<=': queryBuilder = queryBuilder.lte(field, value); break;
        case 'array-contains': queryBuilder = queryBuilder.contains(field, [value]); break;
        case 'in': queryBuilder = queryBuilder.in(field, value); break;
        default: console.warn(`Unsupported filter operator: ${operator}`);
      }
    });

    if (order) {
      queryBuilder = queryBuilder.order(order, { ascending: true });
    }

    if (limitCount) {
      queryBuilder = queryBuilder.limit(limitCount);
    }

    if (lastVisibleDoc) {
      queryBuilder = queryBuilder.gt('id', lastVisibleDoc);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return products;
  } catch (error) {
    console.error('Error fetching non-barcoded products:', error.message);
    throw error;
  }
};

const performEnhancedSearch = async (searchQuery, limitCount = 50) => {
  try {
    
    const { data: similarityResults, error: similarityError } = await supabase
      .rpc('search_products_similarity', {
        search_term: searchQuery,
        similarity_threshold: 0.1,
        limit_count: limitCount
      });

    if (!similarityError && similarityResults && similarityResults.length > 0) {
      return similarityResults;
    }
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    let queryBuilder = supabase.from('non_barcoded_products').select('*');

    if (searchTerms.length === 1) {
      const term = searchTerms[0];
      queryBuilder = queryBuilder.or(
        `product_name_en.ilike.%${term}%,product_name_ro.ilike.%${term}%`
      );
    } else {
      const conditions = searchTerms.map(term => 
        `product_name_en.ilike.%${term}%,product_name_ro.ilike.%${term}%`
      ).join(',');
      queryBuilder = queryBuilder.or(conditions);
    }

    const { data: ilikeResults, error: ilikeError } = await queryBuilder
      .order('product_name_en', { ascending: true })
      .limit(limitCount);

    if (ilikeError) {
      throw new Error(`ILIKE search error: ${ilikeError.message}`);
    }

    if (ilikeResults && ilikeResults.length > 0) {
      const scoredResults = ilikeResults.map(product => {
        const score = calculateRelevanceScore(product, searchQuery);
        return {
          ...product,
          similarity_score: score / 100,
          match_type: score > 80 ? 'exact' : score > 60 ? 'prefix' : 'contains'
        };
      });

      scoredResults.sort((a, b) => b.similarity_score - a.similarity_score);
      return scoredResults;
    }

    const { data: looseResults, error: looseError } = await supabase
      .from('non_barcoded_products')
      .select('*')
      .or(`product_name_en.ilike.%${searchQuery.charAt(0)}%,product_name_ro.ilike.%${searchQuery.charAt(0)}%`)
      .limit(20);

    if (looseError) {
      throw new Error(`Loose search error: ${looseError.message}`);
    }

    return looseResults || [];

  } catch (error) {
    console.error('Enhanced search failed:', error);
    throw error;
  }
};

const calculateRelevanceScore = (product, searchQuery) => {
  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nameEn = (product.product_name_en || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nameRo = (product.product_name_ro || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let maxScore = 0;
  
  [nameEn, nameRo].forEach(name => {
    if (!name) return;
    
    let score = 0;
    
    if (name === normalizedQuery) {
      score = 100;
    }
    else if (name.startsWith(normalizedQuery)) {
      score = 90;
    }
    else if (name.split(' ').some(word => word.startsWith(normalizedQuery))) {
      score = 80;
    }
    else if (name.includes(normalizedQuery)) {
      score = 70;
    }
    else {
      const queryWords = normalizedQuery.split(/\s+/);
      const containsAll = queryWords.every(word => name.includes(word));
      if (containsAll) {
        score = 60;
      } else {
        const matchCount = queryWords.filter(word => name.includes(word)).length;
        score = (matchCount / queryWords.length) * 50;
      }
    }

    maxScore = Math.max(maxScore, score);
  });

  if (product.image) {
    maxScore += 2;
  }

  return maxScore;
};

export const fetchBarcodedProducts = async (limitCount = null, lastVisibleDoc = null) => {
  try {
    let queryBuilder = supabase.from('barcoded_products').select('*');
    
    if (limitCount) {
      queryBuilder = queryBuilder.limit(limitCount);
    }
    
    if (lastVisibleDoc) {
      queryBuilder = queryBuilder.gt('id', lastVisibleDoc);
    }
    
    const { data: products, error } = await queryBuilder;
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
        
    return products;
  } catch (error) {
    console.error('Error fetching barcoded products:', error.message);
    throw error;
  }
};

export const fetchUsuallyUsedFoods = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated.');
    }

    const uid = user.uid;

    const mealQuery = query(
      collection(db, 'meals'),
      where('uid', '==', uid),
      orderBy('usageCount', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(mealQuery);
    const foodUsageCount = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();

      if (data.Nume_Produs) {
        const { Nume_Produs, usageCount = 0 } = data;
        
        if (!foodUsageCount[Nume_Produs]) {
          foodUsageCount[Nume_Produs] = { ...data, usageCount: 0 };
        }

        foodUsageCount[Nume_Produs].usageCount += usageCount;
      } else {
        console.warn('Food details not found in document:', data);
      }
    });

    const frequentFoods = Object.values(foodUsageCount).sort((a, b) => b.usageCount - a.usageCount);
    return frequentFoods;
  } catch (error) {
    console.error("Error fetching usually used foods:", error.message);
    throw error;
  }
};

export const fetchFavoriteFoods = async (limitCount = 10) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated.');
    }
    const uid = user.uid;
    
    const mealQuery = query(
      collection(db, 'meals'),
      where('uid', '==', uid),
    );

    const querySnapshot = await getDocs(mealQuery);
    const favoriteFoods = [];

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const foods = data.foods || [];
      foods.forEach(food => {
        if (food.isFavorite) {
          favoriteFoods.push({ ...food, mealId: doc.id });
        }
      });
    });

    return favoriteFoods;
  } catch (error) {
    console.error("Error fetching favorite foods:", error.message);
    throw error;
  }
};