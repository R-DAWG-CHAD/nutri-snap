'use client';

import React from 'react';
import { Flame, Dumbbell, Wheat, Beef } from 'lucide-react';
import { DailyGoals } from '@/types/tracker';

interface DailyProgressProps {
  summary: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  goals: DailyGoals;
}

export function DailyProgress({ summary, goals }: DailyProgressProps) {
  // Calorie ring calculation
  const calPercent = Math.min(Math.round((summary.calories / goals.calories) * 100), 100);
  const calRemaining = Math.max(0, goals.calories - summary.calories);

  // SVG Circular progress math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

  const macros = [
    {
      name: 'Protein',
      current: summary.proteinGrams,
      target: goals.proteinGrams,
      unit: 'g',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'from-emerald-500/20 to-teal-500/5',
      icon: Dumbbell,
    },
    {
      name: 'Carbs',
      current: summary.carbsGrams,
      target: goals.carbsGrams,
      unit: 'g',
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgGlow: 'from-cyan-500/20 to-blue-500/5',
      icon: Wheat,
    },
    {
      name: 'Fat',
      current: summary.fatGrams,
      target: goals.fatGrams,
      unit: 'g',
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgGlow: 'from-amber-500/20 to-yellow-500/5',
      icon: Beef,
    },
  ];

  return (
    <section className="w-full glass-panel rounded-3xl p-5 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Calorie Ring Section */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-violet-500 transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Flame className="w-5 h-5 text-violet-400 animate-pulse-slow mb-0.5" />
              <span className="text-2xl font-black tracking-tight text-white">
                {summary.calories.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                / {goals.calories.toLocaleString()} kcal
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Daily Energy
            </span>
            <div className="text-xl font-bold text-slate-100">
              {calRemaining > 0 ? (
                <span>
                  <span className="text-violet-400">{calRemaining.toLocaleString()}</span>{' '}
                  <span className="text-xs font-normal text-slate-400">kcal left</span>
                </span>
              ) : (
                <span className="text-amber-400 text-sm font-semibold">Goal Met! 🎉</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>{calPercent}% of daily budget</span>
            </div>
          </div>
        </div>

        {/* Divider for desktop */}
        <div className="hidden md:block w-px h-28 bg-white/10" />

        {/* Macro Progress Bars */}
        <div className="w-full flex-1 flex flex-col gap-3.5">
          {macros.map((macro) => {
            const percent = Math.min(
              Math.round((macro.current / macro.target) * 100),
              100
            );
            const Icon = macro.icon;

            return (
              <div
                key={macro.name}
                className={`p-3 rounded-2xl bg-gradient-to-r ${macro.bgGlow} border ${macro.borderColor} transition-all`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Icon className={`w-4 h-4 ${macro.textColor}`} />
                    <span>{macro.name}</span>
                  </div>
                  <div className="text-slate-300 font-medium">
                    <span className={`font-bold ${macro.textColor}`}>
                      {macro.current}
                    </span>
                    <span className="text-slate-500"> / {macro.target}{macro.unit}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full ${macro.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
