'use client';

import { useState, useEffect } from 'react';
import { Meal, DailyGoals } from '@/types/tracker';

const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  proteinGrams: 150,
  carbsGrams: 200,
  fatGrams: 65,
};

const SAMPLE_MEALS: Meal[] = [
  {
    id: 'sample-1',
    mealName: 'Grilled Chicken & Quinoa Bowl',
    estimatedWeightGrams: 350,
    calories: 540,
    proteinGrams: 45,
    carbsGrams: 52,
    fatGrams: 14,
    confidenceScore: 0.95,
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    mealType: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  },
  {
    id: 'sample-2',
    mealName: 'Greek Yogurt with Berries & Honey',
    estimatedWeightGrams: 220,
    calories: 280,
    proteinGrams: 22,
    carbsGrams: 34,
    fatGrams: 6,
    confidenceScore: 0.92,
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    mealType: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  },
  {
    id: 'sample-3',
    mealName: 'Salmon & Avocado Salad',
    estimatedWeightGrams: 300,
    calories: 520,
    proteinGrams: 38,
    carbsGrams: 18,
    fatGrams: 32,
    confidenceScore: 0.96,
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    mealType: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  },
  {
    id: 'sample-4',
    mealName: 'Protein Shake & Banana',
    estimatedWeightGrams: 350,
    calories: 320,
    proteinGrams: 30,
    carbsGrams: 38,
    fatGrams: 5,
    confidenceScore: 0.90,
    timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    mealType: 'snack',
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80',
  },
];

export function useMacroTracker() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem('nutrisnap_goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }

      const savedMeals = localStorage.getItem('nutrisnap_meals');
      if (savedMeals) {
        const parsed = JSON.parse(savedMeals);
        setMeals(parsed.length > 0 ? parsed : SAMPLE_MEALS);
      } else {
        // Seed with sample data on first run
        setMeals(SAMPLE_MEALS);
        localStorage.setItem('nutrisnap_meals', JSON.stringify(SAMPLE_MEALS));
      }
    } catch (e) {
      console.error('Error reading from localStorage', e);
      setMeals(SAMPLE_MEALS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save meals to LocalStorage
  const saveMeals = (newMeals: Meal[]) => {
    setMeals(newMeals);
    try {
      localStorage.setItem('nutrisnap_meals', JSON.stringify(newMeals));
    } catch (e) {
      console.error('Error saving meals to localStorage', e);
    }
  };

  // Save goals to LocalStorage
  const updateGoals = (newGoals: DailyGoals) => {
    setGoals(newGoals);
    try {
      localStorage.setItem('nutrisnap_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error('Error saving goals to localStorage', e);
    }
  };

  const addMeal = (mealData: Omit<Meal, 'id' | 'timestamp'>) => {
    const newMeal: Meal = {
      ...mealData,
      id: 'meal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
    };
    const updated = [newMeal, ...meals];
    saveMeals(updated);
    return newMeal;
  };

  const updateMeal = (updatedMeal: Meal) => {
    const updated = meals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m));
    saveMeals(updated);
  };

  const deleteMeal = (id: string) => {
    const updated = meals.filter((m) => m.id !== id);
    saveMeals(updated);
  };

  // Filter meals for the selected date
  const filteredMeals = meals.filter((meal) => {
    const mealDate = new Date(meal.timestamp).toISOString().split('T')[0];
    return mealDate === selectedDate;
  });

  // Calculate daily totals for selected date
  const todaySummary = filteredMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      proteinGrams: acc.proteinGrams + (meal.proteinGrams || 0),
      carbsGrams: acc.carbsGrams + (meal.carbsGrams || 0),
      fatGrams: acc.fatGrams + (meal.fatGrams || 0),
    }),
    { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
  );

  // Generate 7-day historical trends array for Recharts
  const get7DayHistory = () => {
    const days: Array<{
      dateLabel: string;
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      calorieGoal: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayMeals = meals.filter(
        (m) => new Date(m.timestamp).toISOString().split('T')[0] === isoDate
      );

      const dayTotals = dayMeals.reduce(
        (acc, m) => {
          acc.calories += m.calories || 0;
          acc.protein += m.proteinGrams || 0;
          acc.carbs += m.carbsGrams || 0;
          acc.fat += m.fatGrams || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      days.push({
        dateLabel: dayName,
        date: isoDate,
        calories: dayTotals.calories,
        protein: dayTotals.protein,
        carbs: dayTotals.carbs,
        fat: dayTotals.fat,
        calorieGoal: goals.calories,
      });
    }

    return days;
  };

  return {
    meals,
    filteredMeals,
    goals,
    selectedDate,
    setSelectedDate,
    todaySummary,
    addMeal,
    updateMeal,
    deleteMeal,
    updateGoals,
    get7DayHistory,
    isLoaded,
  };
}
