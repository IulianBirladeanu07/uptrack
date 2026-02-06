import { db, collection, setDoc, doc, getDoc } from '../services/firebaseConfigService';
import WeightService from './weightService';
import { calculateWeightChangePlan } from './nutritionCalculations';

export const saveUserProfile = async (uid, profileData) => {
  try {
    const userDocRef = doc(collection(db, 'users'), uid);
    await setDoc(userDocRef, profileData, { merge: true });
  } catch (error) {
    console.error('Error saving profile data:', error.message);
    throw new Error('Failed to save profile data');
  }
};

export const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(collection(db, 'users'), uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching profile data:', error.message);
    throw new Error('Failed to fetch profile data');
  }
};

export const initializeUserWeightTracking = async (uid, initialWeight) => {
  try {
    const today = new Date();
    const weekStartDate = WeightService.getWeekStartDate(today).toISOString().split('T')[0];
    const dayKey = WeightService.getDayKey(today);

    const initialWeightData = {
      currentWeight: initialWeight,
      weightIns: [
        {
          weekStart: weekStartDate,
          days: { [dayKey]: initialWeight },
          average: initialWeight,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        }
      ],
      lastWeightUpdate: new Date().toISOString(),
      weeklyTrend: null,
    };

    await saveUserProfile(uid, initialWeightData);
    return initialWeightData;
  } catch (error) {
    console.error('Error initializing weight tracking:', error);
    throw error;
  }
};

export const updateUserNutritionPlan = async (uid) => {
  try {
    const userProfile = await fetchUserProfile(uid);
    if (!userProfile) throw new Error('User profile not found');

    const weightData = await WeightService.getWeightDisplayData(uid, new Date());    
    const currentWeight = weightData.currentWeight || userProfile.currentWeight;
    const updatedFormData = {
      ...userProfile,
      currentWeight: currentWeight,
    };

    const newWeightChangePlan = calculateWeightChangePlan(updatedFormData);
    const updatedProfile = {
      ...userProfile,
      currentWeight: currentWeight,
      weightChangePlan: newWeightChangePlan,
      lastNutritionUpdate: new Date().toISOString(),
    };

    await saveUserProfile(uid, updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    throw error;
  }
};

export const getUserDashboardData = async (uid, selectedDate = new Date()) => {
  try {
    const [userProfile, weightData, weightHistory] = await Promise.all([
      fetchUserProfile(uid),
      WeightService.getWeightDisplayData(uid, selectedDate),
      WeightService.getWeightHistory(uid, 8),
    ]);

    return {
      profile: userProfile,
      weight: weightData,
      weightHistory: weightHistory,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const performWeeklyUserMaintenance = async (uid) => {
  try {    
    const adjustmentResult = await WeightService.adjustUserTargetsBasedOnProgress(uid);
    
    if (adjustmentResult) {
      await saveUserProfile(uid, {
        weightChangePlan: adjustmentResult,
        lastMaintenanceRun: new Date().toISOString(),
      });
      
      return {
        adjusted: true,
        newPlan: adjustmentResult,
      };
    } else {
      await saveUserProfile(uid, {
        lastMaintenanceRun: new Date().toISOString(),
      });
      
      return {
        adjusted: false,
        message: 'No adjustments needed',
      };
    }
  } catch (error) {
    console.error('Error during weekly maintenance:', error);
    return {
      adjusted: false,
      error: error.message,
    };
  }
};

export const getCurrentUserMacros = async (uid) => {
  try {
    const userProfile = await fetchUserProfile(uid);
    if (!userProfile || !userProfile.weightChangePlan) {
      throw new Error('User nutrition plan not found');
    }

    const { weightChangePlan } = userProfile;
    
    return {
      targetCalories: weightChangePlan.goalCalories,
      targetProtein: weightChangePlan.macros.protein,
      targetCarbs: weightChangePlan.macros.carbs,
      targetFats: weightChangePlan.macros.fats,
      planType: weightChangePlan.type,
      lastAdjusted: weightChangePlan.lastAdjusted || weightChangePlan.createdAt,
    };
  } catch (error) {
    console.error('Error getting current macros:', error);
    throw error;
  }
};

export const shouldUpdateNutritionPlan = async (uid) => {
  try {
    const userProfile = await fetchUserProfile(uid);
    if (!userProfile) return false;

    const lastUpdate = new Date(userProfile.lastNutritionUpdate || userProfile.createdAt);
    const daysSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 14) return true;
    
    const weightData = await WeightService.getWeightDisplayData(uid, new Date());
    const currentWeight = weightData.currentWeight || userProfile.currentWeight;
    const targetWeight = userProfile.targetWeight;
    
    if (Math.abs(currentWeight - targetWeight) > 2) return true;
    
    return false;
  } catch (error) {
    console.error('Error checking nutrition plan update:', error);
    return false;
  }
};

export default {
  saveUserProfile,
  fetchUserProfile,
  initializeUserWeightTracking,
  updateUserNutritionPlan,
  getUserDashboardData,
  performWeeklyUserMaintenance,
  getCurrentUserMacros,
  shouldUpdateNutritionPlan,
};