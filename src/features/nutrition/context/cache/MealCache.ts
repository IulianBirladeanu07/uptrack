import type { DateInput, LoggedFood, MealCacheLike, MealGroup, MealType, MealsByType } from '../../../../shared/types';
import { formatDate, toLocalDate } from '../../utils/dateUtils';

class MealCache implements MealCacheLike {
    data: Map<string, MealsByType>;
    stepsData: Map<string, number>;
    maxSize: number;
    private edited: Map<string, Set<MealType>>;

    constructor(maxSize = 60) {
        this.data = new Map();
        this.stepsData = new Map();
        this.maxSize = maxSize;
        this.edited = new Map();
    }

    get(key: string): MealsByType {
        if (this.data.has(key)) return this.data.get(key)!;
        return { breakfast: [], lunch: [], dinner: [], snacks: [] };
    }

    set(key: string, value: MealsByType): void {
        if (this.data.size >= this.maxSize && !this.data.has(key)) {
            let oldestKey: string | null = null;
            for (const k of this.data.keys()) {
                if (oldestKey === null || k < oldestKey) oldestKey = k;
            }
            if (oldestKey !== null) this.data.delete(oldestKey);
        }
        this.data.set(key, value);
    }

    has(key: string): boolean {
        return this.data.has(key);
    }

    clear(): void {
        this.data.clear();
        this.stepsData.clear();
        this.edited.clear();
    }

    updateMealType(dateKey: string, mealType: MealType, foods: LoggedFood[]): MealsByType {
        const dayMeals = this.get(dateKey);
        dayMeals[mealType] = foods;
        this.set(dateKey, dayMeals);
        const types = this.edited.get(dateKey) ?? new Set<MealType>();
        types.add(mealType);
        this.edited.set(dateKey, types);
        return dayMeals;
    }

    buildFromMeals(meals: MealGroup[]): void {
        const kept: { date: string; mealType: MealType; foods: LoggedFood[] }[] = [];
        this.edited.forEach((types, date) => {
            if (!this.data.has(date)) return;
            types.forEach(mealType => kept.push({ date, mealType, foods: this.get(date)[mealType] }));
        });
        this.data.clear();
        const groupedMeals = new Map<string, MealsByType>();
        meals.forEach(meal => {
            const dateKey = meal.date;
            if (!groupedMeals.has(dateKey)) groupedMeals.set(dateKey, { breakfast: [], lunch: [], dinner: [], snacks: [] });
            groupedMeals.get(dateKey)![meal.mealType] = meal.foods || [];
        });
        groupedMeals.forEach((meals, date) => this.set(date, meals));
        kept.forEach(({ date, mealType, foods }) => {
            const dayMeals = this.get(date);
            dayMeals[mealType] = foods;
            this.set(date, dayMeals);
        });
    }

    getDateRange(startDate: DateInput, endDate: DateInput): { date: string; meals: MealsByType }[] {
        const results: { date: string; meals: MealsByType }[] = [];
        const start = toLocalDate(startDate);
        const end = toLocalDate(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = this.formatDate(d);
            results.push({ date: dateKey, meals: this.get(dateKey) });
        }
        return results;
    }

    setSteps(dateKey: string, steps: number): void {
        this.stepsData.set(dateKey, steps);
    }

    getSteps(dateKey: string): number {
        return this.stepsData.get(dateKey) || 0;
    }

    getStepsRange(startDate: DateInput, endDate: DateInput): { date: string; steps: number }[] {
        const results: { date: string; steps: number }[] = [];
        const start = toLocalDate(startDate);
        const end = toLocalDate(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = this.formatDate(d);
            results.push({ date: dateKey, steps: this.getSteps(dateKey) });
        }
        return results;
    }

    formatDate(date: DateInput): string {
        return formatDate(date);
    }
}

export default MealCache;
