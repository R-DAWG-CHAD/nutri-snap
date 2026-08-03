'use client';

import React from 'react';
import { AlertTriangle, Sparkles, Dumbbell, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Meal, DailyGoals } from '@/types/tracker';
import { getLocalDateString } from '@/hooks/useMacroTracker';

interface MacroWarningsProps {
  meals: Meal[];
  goals: DailyGoals;
}

export function MacroWarnings({ meals, goals }: MacroWarningsProps) {
  // Analyze last 4 days of history
  const getMultiDayAnalysis = () => {
    const today = new Date();
    const daysData: Array<{ date: string; protein: number; carbs: number; fat: number; calories: number }> = [];

    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = getLocalDateString(d);
      const dayMeals = meals.filter(
        (m) => getLocalDateString(new Date(m.timestamp)) === iso
      );

      if (dayMeals.length > 0) {
        const totals = dayMeals.reduce(
          (acc, m) => {
            acc.protein += m.proteinGrams || 0;
            acc.carbs += m.carbsGrams || 0;
            acc.fat += m.fatGrams || 0;
            acc.calories += m.calories || 0;
            return acc;
          },
          { protein: 0, carbs: 0, fat: 0, calories: 0 }
        );
        daysData.push({ date: iso, ...totals });
      }
    }

    if (daysData.length < 2) return null; // Need at least 2 logged days for pattern detection

    let lowProteinDays = 0;
    let highCarbDays = 0;
    let highFatDays = 0;

    daysData.forEach((day) => {
      if (day.protein < goals.proteinGrams * 0.75) lowProteinDays++;
      if (day.carbs > goals.carbsGrams * 1.25) highCarbDays++;
      if (day.fat > goals.fatGrams * 1.25) highFatDays++;
    });

    const warnings: Array<{ id: string; title: string; desc: string; type: 'warning' | 'info' | 'success' }> = [];

    if (lowProteinDays >= 2) {
      warnings.push({
        id: 'low-protein',
        title: `Low Protein Trend Detected (${lowProteinDays}/${daysData.length} Recent Days)`,
        desc: `Your protein intake has averaged below 75% of your target (${goals.proteinGrams}g). Prioritize lean meats, eggs, Greek yogurt, or whey shakes to protect lean muscle tissue during fat loss.`,
        type: 'warning',
      });
    }

    if (highCarbDays >= 2) {
      warnings.push({
        id: 'high-carbs',
        title: `High Carb Surplus Trend (${highCarbDays}/${daysData.length} Recent Days)`,
        desc: `Carbohydrate intake exceeded 125% of your daily budget (${goals.carbsGrams}g). Consider swapping refined carbs for fiber-dense vegetables or lean protein sources.`,
        type: 'warning',
      });
    }

    if (lowProteinDays === 0 && warnings.length === 0) {
      warnings.push({
        id: 'great-consistency',
        title: 'Excellent Macro Consistency!',
        desc: 'You have hit your protein and daily energy targets consistently over recent days. Keep up the strong momentum!',
        type: 'success',
      });
    }

    return warnings;
  };

  const warnings = getMultiDayAnalysis();
  if (!warnings || warnings.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-2.5">
      {warnings.map((w) => (
        <div
          key={w.id}
          className={`p-4 rounded-2xl border transition-all shadow-lg flex items-start gap-3 ${
            w.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : w.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <div className="p-1.5 rounded-xl bg-slate-950/60 border border-white/10 flex-shrink-0 mt-0.5">
            {w.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold tracking-tight text-white mb-0.5">{w.title}</h4>
            <p className="text-[11px] leading-relaxed text-slate-300">{w.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
