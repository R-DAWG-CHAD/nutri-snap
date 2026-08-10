'use client';

import React from 'react';
import { Flame, Settings, ChevronLeft, ChevronRight, Calendar, Sparkles, Scale } from 'lucide-react';
import { getLocalDateString } from '@/hooks/useMacroTracker';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenGoals: () => void;
  onOpenAIPlan: () => void;
  onOpenWeighIn: () => void;
}

export function Navbar({
  selectedDate,
  onDateChange,
  onOpenGoals,
  onOpenAIPlan,
  onOpenWeighIn,
}: NavbarProps) {
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - 1);
    onDateChange(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + 1);
    onDateChange(getLocalDateString(d));
  };

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-3 py-2.5 overflow-hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1.5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Flame className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white hidden xs:inline sm:inline">
            NutriSnap
          </span>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-full px-1.5 py-0.5 shadow-inner flex-shrink">
          <button
            onClick={handlePrevDay}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDateChange(todayStr)}
            className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-200 hover:text-emerald-400 flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span>{isToday ? 'Today' : formattedDate}</span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Scale Weigh-Ins Button */}
          <button
            onClick={onOpenWeighIn}
            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
            title="Weekly Scale Weigh-Ins"
            aria-label="Weekly Scale Weigh-Ins"
          >
            <Scale className="w-4 h-4" />
          </button>

          {/* AI Plan Wizard Button */}
          <button
            onClick={onOpenAIPlan}
            className="p-2 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm"
            title="AI Macro Plan Calculator"
            aria-label="AI Macro Plan Calculator"
          >
            <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline">AI Plan</span>
          </button>

          {/* Target Settings Button */}
          <button
            onClick={onOpenGoals}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
            title="Target Goals Settings"
            aria-label="Target Goals Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
