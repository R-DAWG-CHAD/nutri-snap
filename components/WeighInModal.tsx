'use client';

import React, { useState } from 'react';
import { X, Scale, Plus, Trash2, Sparkles, TrendingDown, Check, Calendar } from 'lucide-react';
import { WeighIn, DailyGoals } from '@/types/tracker';

interface WeighInModalProps {
  isOpen: boolean;
  onClose: () => void;
  weighIns: WeighIn[];
  goals: DailyGoals;
  onAddWeighIn: (weightKg: number, notes?: string) => void;
  onDeleteWeighIn: (id: string) => void;
  onUpdateGoals: (newGoals: DailyGoals) => void;
}

export function WeighInModal({
  isOpen,
  onClose,
  weighIns,
  goals,
  onAddWeighIn,
  onDeleteWeighIn,
  onUpdateGoals,
}: WeighInModalProps) {
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  if (!isOpen) return null;

  // Convert kg to active unit
  const formatWeight = (kg: number) => {
    if (unit === 'lbs') return `${Math.round(kg * 2.20462)} lbs`;
    return `${kg.toFixed(1)} kg`;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newWeightInput);
    if (!val || val <= 0) return;
    const kg = unit === 'lbs' ? val / 2.20462 : val;
    onAddWeighIn(Number(kg.toFixed(1)), notesInput || undefined);
    setNewWeightInput('');
    setNotesInput('');
  };

  // Calculate weekly weight change rate
  const sortedWeighIns = [...weighIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latest = sortedWeighIns[0];
  const previous = sortedWeighIns[1];
  const weightDeltaKg = latest && previous ? latest.weightKg - previous.weightKg : 0;

  // AI readjustment recommendation logic
  const recommendAdjustment = () => {
    if (!latest || !previous) return null;

    if (weightDeltaKg < -0.3) {
      return {
        status: 'Great Progress!',
        recommendation: 'Weight loss rate is optimal (~0.5 - 0.7kg/week). Keep current macro targets intact.',
        suggestedCalories: goals.calories,
        suggestedProtein: goals.proteinGrams,
        color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      };
    } else if (weightDeltaKg >= -0.1) {
      // Stagnant
      const newCals = Math.max(1400, goals.calories - 100);
      const newProtein = Math.min(220, goals.proteinGrams + 5);
      return {
        status: 'Stagnation Detected',
        recommendation: `Weight change plateaued (${weightDeltaKg > 0 ? '+' : ''}${formatWeight(weightDeltaKg)} this week). Recommend trimming daily calories by 100 kcal to restart fat burn.`,
        suggestedCalories: newCals,
        suggestedProtein: newProtein,
        color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      };
    } else {
      return null;
    }
  };

  const adjustment = recommendAdjustment();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md glass-modal rounded-3xl border border-white/10 p-6 shadow-2xl relative my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Weekly Weigh-Ins</h2>
              <p className="text-[11px] text-slate-400">Track weight trends & auto-readjust macro targets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-semibold text-slate-300">Logged Scale Weights</span>
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setUnit('lbs')}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                unit === 'lbs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              lbs
            </button>
            <button
              type="button"
              onClick={() => setUnit('kg')}
              className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                unit === 'kg' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              kg
            </button>
          </div>
        </div>

        {/* Add New Weigh-In Form */}
        <form onSubmit={handleAdd} className="mt-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-200">Log Today's Scale Weight</span>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              required
              value={newWeightInput}
              onChange={(e) => setNewWeightInput(e.target.value)}
              placeholder={`e.g. ${unit === 'lbs' ? '182.5' : '82.5'}`}
              className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
            />

            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Optional note e.g. morning fast..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log</span>
            </button>
          </div>
        </form>

        {/* Smart Readjustment Card */}
        {adjustment && (
          <div className={`mt-4 p-3.5 rounded-2xl border ${adjustment.color} flex flex-col gap-2 shadow-lg`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Readjustment Insight: {adjustment.status}</span>
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">{adjustment.recommendation}</p>

            {adjustment.suggestedCalories !== goals.calories && (
              <button
                type="button"
                onClick={() => {
                  onUpdateGoals({
                    ...goals,
                    calories: adjustment.suggestedCalories,
                    proteinGrams: adjustment.suggestedProtein,
                  });
                  alert('Daily target goals updated successfully!');
                }}
                className="mt-1 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply -100 kcal Macro Readjustment</span>
              </button>
            )}
          </div>
        )}

        {/* Weigh-Ins History Feed */}
        <div className="mt-4 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-slate-400">History Log</span>
          {sortedWeighIns.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No weigh-ins logged yet.</p>
          ) : (
            sortedWeighIns.map((w, index) => {
              const prev = sortedWeighIns[index + 1];
              const diff = prev ? w.weightKg - prev.weightKg : null;

              return (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-xs">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100">{formatWeight(w.weightKg)}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {w.date}
                        </span>
                        {w.notes && <span className="italic text-slate-500">"{w.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span
                        className={`text-xs font-bold ${
                          diff < 0 ? 'text-emerald-400' : diff > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}
                        {formatWeight(diff)}
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteWeighIn(w.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
