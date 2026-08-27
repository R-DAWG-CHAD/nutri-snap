'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Settings, Flame, Dumbbell, Wheat, Beef, Sparkles } from 'lucide-react';
import { DailyGoals } from '@/types/tracker';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  onSave: (newGoals: DailyGoals) => void;
  onOpenAIPlan?: () => void;
  onExport?: () => void;
  onImport?: (jsonStr: string) => void;
}

export function GoalsModal({
  isOpen,
  onClose,
  goals,
  onSave,
  onOpenAIPlan,
  onExport,
  onImport,
}: GoalsModalProps) {
  const [calories, setCalories] = useState<number | ''>(goals.calories);
  const [protein, setProtein] = useState<number | ''>(goals.proteinGrams);
  const [carbs, setCarbs] = useState<number | ''>(goals.carbsGrams);
  const [fat, setFat] = useState<number | ''>(goals.fatGrams);

  useEffect(() => {
    setCalories(goals.calories);
    setProtein(goals.proteinGrams);
    setCarbs(goals.carbsGrams);
    setFat(goals.fatGrams);
  }, [goals]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      calories: calories === '' ? 2000 : Number(calories),
      proteinGrams: protein === '' ? 150 : Number(protein),
      carbsGrams: carbs === '' ? 200 : Number(carbs),
      fatGrams: fat === '' ? 65 : Number(fat),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm glass-modal rounded-3xl border border-white/10 p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Settings & Targets</h2>
              <p className="text-[11px] text-slate-400">Customize target goals or calculate with AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Macro Plan Banner */}
        {onOpenAIPlan && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Macro Plan Calculator</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Let Gemini calculate BMR & optimal targets</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAIPlan();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
            >
              <span>AI Wizard</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-4">
          {/* Calorie Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-violet-400" />
              <span>Daily Calorie Target (kcal)</span>
            </label>
            <input
              type="number"
              min="500"
              max="10000"
              value={calories}
              onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-violet-300 font-bold text-base focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Protein Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>Protein Goal (grams)</span>
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={protein}
              onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-emerald-300 font-bold text-base focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Carbs Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-cyan-400" />
              <span>Carbohydrates Goal (grams)</span>
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-cyan-300 font-bold text-base focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Fat Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Beef className="w-4 h-4 text-amber-400" />
              <span>Fats Goal (grams)</span>
            </label>
            <input
              type="number"
              min="5"
              max="500"
              value={fat}
              onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-amber-300 font-bold text-base focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Backup & Restore Data section */}
          {(onExport || onImport) && (
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Data Management & Backup</span>
              <div className="flex items-center gap-2">
                {onExport && (
                  <button
                    type="button"
                    onClick={onExport}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>📥 Export Backup</span>
                  </button>
                )}

                {onImport && (
                  <label className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 font-semibold text-xs cursor-pointer text-center flex items-center justify-center gap-1.5">
                    <span>📤 Restore Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const text = evt.target?.result as string;
                            if (text) onImport(text);
                          };
                          reader.readAsText(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Goals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
