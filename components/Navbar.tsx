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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Flame className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                NutriSnap
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-full px-2 py-1 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDateChange(todayStr)}
            className="px-2 py-0.5 text-xs font-medium text-slate-200 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>{isToday ? 'Today' : formattedDate}</span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenWeighIn}
            className="p-2 text-cyan-400 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
            title="Weekly Scale Weigh-Ins"
            aria-label="Weekly Scale Weigh-Ins"
          >
            <Scale className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenAIPlan}
            className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="AI Macro Plan Calculator"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Plan</span>
          </button>

          <button
            onClick={onOpenGoals}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
            title="Target Goals Settings"
            aria-label="Target Goals Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
