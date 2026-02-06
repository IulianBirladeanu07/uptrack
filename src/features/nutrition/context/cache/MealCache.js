class MealCache {
  constructor(maxSize = 60) {
    this.data = new Map();
    this.stepsData = new Map();
    this.maxSize = maxSize;
    this.defaultMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  }
  
  get(key) { 
    if (this.data.has(key)) {
      return this.data.get(key);
    }
    return { ...this.defaultMeals }; 
  }
  
  set(key, value) { 
    if (this.data.size >= this.maxSize && !this.data.has(key)) {
      const oldestKey = Array.from(this.data.keys())[0];
      this.data.delete(oldestKey);
    }
    
    this.data.set(key, value);
  }
  
  has(key) { 
    return this.data.has(key); 
  }
  
  clear() { 
    this.data.clear();
    this.stepsData.clear();
  }
  
  updateMealType(dateKey, mealType, foods) {
    const dayMeals = this.get(dateKey);
    dayMeals[mealType] = foods;
    this.set(dateKey, dayMeals);
    return dayMeals;
  }
  
  buildFromMeals(meals) {
    this.clear();
    const groupedMeals = new Map();
    
    meals.forEach(meal => {
      const dateKey = meal.date;
      if (!groupedMeals.has(dateKey)) {
        groupedMeals.set(dateKey, { ...this.defaultMeals });
      }
      groupedMeals.get(dateKey)[meal.mealType] = meal.foods || [];
    });
    
    groupedMeals.forEach((meals, date) => {
      this.set(date, meals);
    });
  }

  getDateRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = this.formatDate(d);
      const meals = this.get(dateKey);
      results.push({ date: dateKey, meals });
    }
    
    return results;
  }

  setSteps(dateKey, steps) {
    this.stepsData.set(dateKey, steps);
  }
  
  getSteps(dateKey) {
    return this.stepsData.get(dateKey) || 0;
  }
  
  getStepsRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = this.formatDate(d);
      results.push({ date: dateKey, steps: this.getSteps(dateKey) });
    }
    
    return results;
  }

  formatDate(date) {
    return (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];
  }
}

export default MealCache;