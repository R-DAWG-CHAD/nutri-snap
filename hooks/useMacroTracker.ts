'use client';

import { useState, useEffect } from 'react';
import { Meal, DailyGoals, WeighIn } from '@/types/tracker';
import { compressImage } from '@/utils/compressImage';

// Local timezone date string helper (YYYY-MM-DD)
export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  proteinGrams: 150,
  carbsGrams: 200,
  fatGrams: 65,
};

const SAMPLE_WEIGH_INS: WeighIn[] = [
  { id: 'w-1', weightKg: 82.5, date: getLocalDateString(new Date(Date.now() - 14 * 86400 * 1000)) },
  { id: 'w-2', weightKg: 81.8, date: getLocalDateString(new Date(Date.now() - 7 * 86400 * 1000)) },
  { id: 'w-3', weightKg: 81.2, date: getLocalDateString(new Date()) },
];

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
];

export function useMacroTracker() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
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
        setMeals(SAMPLE_MEALS);
        localStorage.setItem('nutrisnap_meals', JSON.stringify(SAMPLE_MEALS));
      }

      const savedWeighIns = localStorage.getItem('nutrisnap_weighins');
      if (savedWeighIns) {
        setWeighIns(JSON.parse(savedWeighIns));
      } else {
        setWeighIns(SAMPLE_WEIGH_INS);
        localStorage.setItem('nutrisnap_weighins', JSON.stringify(SAMPLE_WEIGH_INS));
      }
    } catch (e) {
      console.error('Error reading from localStorage', e);
      setMeals(SAMPLE_MEALS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveWeighIns = (newWeighIns: WeighIn[]) => {
    setWeighIns(newWeighIns);
    try {
      localStorage.setItem('nutrisnap_weighins', JSON.stringify(newWeighIns));
    } catch (e) {
      console.error('Error saving weigh-ins to localStorage', e);
    }
  };

  const addWeighIn = (weightKg: number, notes?: string) => {
    const todayStr = getLocalDateString(new Date());
    const newEntry: WeighIn = {
      id: 'w-' + Date.now(),
      weightKg,
      date: todayStr,
      notes,
    };
    const updated = [newEntry, ...weighIns.filter((w) => w.date !== todayStr)];
    saveWeighIns(updated);
    return newEntry;
  };

  const deleteWeighIn = (id: string) => {
    const updated = weighIns.filter((w) => w.id !== id);
    saveWeighIns(updated);
  };

  // Quota-safe meal saving with thumbnail image compression
  const saveMeals = async (newMeals: Meal[]) => {
    const processedMeals = await Promise.all(
      newMeals.map(async (m) => {
        if (m.imageUrl && m.imageUrl.startsWith('data:image') && m.imageUrl.length > 40000) {
          const compressed = await compressImage(m.imageUrl, 300, 300, 0.6);
          return { ...m, imageUrl: compressed };
        }
        return m;
      })
    );

    setMeals(processedMeals);

    try {
      localStorage.setItem('nutrisnap_meals', JSON.stringify(processedMeals));
    } catch (e) {
      console.warn('LocalStorage QuotaExceededError - applying fallback cleanup to save meals', e);
      try {
        // Strip heavy base64 strings from old meals (keeping text data & macros intact)
        const lightMeals = processedMeals.map((m, idx) => {
          if (idx > 4 && m.imageUrl && m.imageUrl.startsWith('data:image')) {
            return { ...m, imageUrl: undefined };
          }
          return m;
        });
        localStorage.setItem('nutrisnap_meals', JSON.stringify(lightMeals));
        setMeals(lightMeals);
      } catch (err2) {
        console.error('Failed to save to LocalStorage', err2);
      }
    }
  };

  const updateGoals = (newGoals: DailyGoals) => {
    setGoals(newGoals);
    try {
      localStorage.setItem('nutrisnap_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error('Error saving goals to localStorage', e);
    }
  };

  const addMeal = async (mealData: Omit<Meal, 'id' | 'timestamp'>, customDate?: string) => {
    const targetDateStr = customDate || selectedDate;
    const now = new Date();

    const [year, month, day] = targetDateStr.split('-').map(Number);
    const mealTimestampDate = new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );

    let compressedUrl = mealData.imageUrl;
    if (compressedUrl && compressedUrl.startsWith('data:image') && compressedUrl.length > 40000) {
      compressedUrl = await compressImage(compressedUrl, 300, 300, 0.6);
    }

    const newMeal: Meal = {
      ...mealData,
      imageUrl: compressedUrl,
      id: 'meal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: mealTimestampDate.toISOString(),
    };
    const updated = [newMeal, ...meals];
    await saveMeals(updated);
    return newMeal;
  };

  const updateMeal = async (updatedMeal: Meal) => {
    let compressedUrl = updatedMeal.imageUrl;
    if (compressedUrl && compressedUrl.startsWith('data:image') && compressedUrl.length > 40000) {
      compressedUrl = await compressImage(compressedUrl, 300, 300, 0.6);
    }

    const processed = { ...updatedMeal, imageUrl: compressedUrl };
    const updated = meals.map((m) => (m.id === processed.id ? processed : m));
    await saveMeals(updated);
  };

  const deleteMeal = (id: string) => {
    const updated = meals.filter((m) => m.id !== id);
    saveMeals(updated);
  };

  // Filter meals for the selected date using local timezone date string
  const filteredMeals = meals.filter((meal) => {
    const mealDate = getLocalDateString(new Date(meal.timestamp));
    return mealDate === selectedDate;
  });

  const todaySummary = filteredMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      proteinGrams: acc.proteinGrams + (meal.proteinGrams || 0),
      carbsGrams: acc.carbsGrams + (meal.carbsGrams || 0),
      fatGrams: acc.fatGrams + (meal.fatGrams || 0),
    }),
    { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
  );

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

    const todayStr = getLocalDateString(new Date());

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = getLocalDateString(d);
      const dayName = isoDate === todayStr ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayMeals = meals.filter(
        (m) => getLocalDateString(new Date(m.timestamp)) === isoDate
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

  const exportData = () => {
    try {
      const backupObj = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        goals,
        meals,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupObj, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `nutrisnap_backup_${getLocalDateString(new Date())}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Export error:', e);
      alert('Failed to export backup data.');
    }
  };

  const importData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.goals) {
        updateGoals(parsed.goals);
      }
      if (Array.isArray(parsed.meals)) {
        saveMeals(parsed.meals);
      }
      alert('Backup restored successfully!');
      return true;
    } catch (e) {
      console.error('Import error:', e);
      alert('Invalid backup JSON file format.');
      return false;
    }
  };

  return {
    meals,
    filteredMeals,
    weighIns,
    goals,
    selectedDate,
    setSelectedDate,
    todaySummary,
    addMeal,
    updateMeal,
    deleteMeal,
    addWeighIn,
    deleteWeighIn,
    updateGoals,
    get7DayHistory,
    exportData,
    importData,
    isLoaded,
  };
}
