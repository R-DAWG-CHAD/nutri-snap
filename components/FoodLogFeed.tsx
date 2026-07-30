'use client';

import React from 'react';
import { Meal } from '@/types/tracker';
import { Trash2, Edit2, Plus, Utensils, Clock, Flame, Scale } from 'lucide-react';

interface FoodLogFeedProps {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
  onAddManual: () => void;
}

export function FoodLogFeed({ meals, onEdit, onDelete, onAddManual }: FoodLogFeedProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <section className="w-full glass-panel rounded-3xl p-5 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Logged Meals</h3>
            <p className="text-[11px] text-slate-400">
              {meals.length} {meals.length === 1 ? 'item' : 'items'} today
            </p>
          </div>
        </div>

        <button
          onClick={onAddManual}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-emerald-500/40"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Manual Entry</span>
        </button>
      </div>

      {meals.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-slate-950/40">
          <Utensils className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-300">No meals logged for this date</p>
          <p className="text-xs text-slate-500 max-w-xs mt-0.5">
            Use the camera above or manual entry button to track your nutrition!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="group p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Thumbnail Image or Icon */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0 flex items-center justify-center">
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.mealName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Utensils className="w-6 h-6 text-slate-500" />
                  )}
                  {meal.mealType && (
                    <span className="absolute top-1 left-1 px-1 py-0.2 text-[9px] font-bold uppercase bg-slate-950/80 text-emerald-400 rounded">
                      {meal.mealType[0]}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                    {meal.mealName}
                  </h4>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-300">
                      <Flame className="w-3 h-3 text-violet-400" />
                      {meal.calories} kcal
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-slate-500" />
                      {meal.estimatedWeightGrams}g
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(meal.timestamp)}
                    </span>
                  </div>

                  {/* Macro chips */}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      P: {meal.proteinGrams}g
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                      C: {meal.carbsGrams}g
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                      F: {meal.fatGrams}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(meal)}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                  title="Edit meal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(meal.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="Delete meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
