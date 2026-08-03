export interface Meal {
  id: string;
  mealName: string;
  estimatedWeightGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  confidenceScore: number; // 0 to 1
  timestamp: string; // ISO string
  imageUrl?: string; // base64 or photo URL
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
}

export interface DailyGoals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface FoodAnalysisResponse {
  mealName: string;
  estimatedWeightGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  confidenceScore: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface WeighIn {
  id: string;
  weightKg: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
