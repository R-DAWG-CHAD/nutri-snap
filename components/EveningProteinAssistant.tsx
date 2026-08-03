'use client';

import React from 'react';
import { Sparkles, Dumbbell, Plus, Moon, Flame } from 'lucide-react';
import { DailyGoals, Meal } from '@/types/tracker';

interface EveningProteinAssistantProps {
  todaySummary: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  goals: DailyGoals;
  onQuickLog: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
}

export function EveningProteinAssistant({
  todaySummary,
  goals,
  onQuickLog,
}: EveningProteinAssistantProps) {
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 17 || currentHour <= 4; // After 5 PM or late night

  const remainingProtein = Math.max(0, goals.proteinGrams - todaySummary.proteinGrams);
  const remainingCalories = Math.max(0, goals.calories - todaySummary.calories);

  // Trigger assistant if protein deficit is >= 25g and calories remaining >= 150 kcal
  if (!isEvening || remainingProtein < 25 || remainingCalories < 150) {
    return null;
  }

  const suggestions = [
    {
      name: 'Greek Yogurt & Whey Bowl',
      weight: 220,
      calories: 220,
      protein: 32,
      carbs: 14,
      fat: 2,
      mealType: 'snack' as const,
      icon: '🥣',
    },
    {
      name: 'Cottage Cheese & Honey',
      weight: 200,
      calories: 195,
      protein: 26,
      carbs: 12,
      fat: 4,
      mealType: 'snack' as const,
      icon: '🧀',
    },
    {
      name: 'Egg White & Whole Egg Omelet',
      weight: 180,
      calories: 180,
      protein: 24,
      carbs: 2,
      fat: 7,
      mealType: 'snack' as const,
      icon: '🍳',
    },
    {
      name: 'Quick Tuna & Mayo Cup',
      weight: 150,
      calories: 190,
      protein: 30,
      carbs: 2,
      fat: 6,
      mealType: 'snack' as const,
      icon: '🐟',
    },
  ];

  return (
    <section className="w-full glass-panel rounded-3xl p-5 border border-emerald-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950">
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Header Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Moon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>Evening Protein Assistant</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400">
                You still need <span className="font-bold text-emerald-400">{remainingProtein}g Protein</span> within{' '}
                <span className="font-bold text-violet-400">{remainingCalories} kcal</span> remaining
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-900/90 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2 shadow-md group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-emerald-400">{item.protein}g Protein</span>
                    <span className="text-violet-300">{item.calories} kcal</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  onQuickLog({
                    mealName: item.name,
                    estimatedWeightGrams: item.weight,
                    calories: item.calories,
                    proteinGrams: item.protein,
                    carbsGrams: item.carbs,
                    fatGrams: item.fat,
                    confidenceScore: 1.0,
                    mealType: item.mealType,
                  })
                }
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-md transition-all active:scale-95 flex-shrink-0"
                title="1-Tap Quick Log"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Log</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
