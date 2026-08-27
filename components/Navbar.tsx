'use client';

import React from 'react';
import { Settings, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getLocalDateString } from '@/hooks/useMacroTracker';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenGoals: () => void;
  onOpenWeighIn?: () => void;
}

export function Navbar({
  selectedDate,
  onDateChange,
  onOpenGoals,
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-2.5 overflow-hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Date Selector (Expanded & Centered for Mobile Phone Touch Targets) */}
        <div className="flex-1 flex items-center justify-center bg-slate-900/90 border border-white/10 rounded-full px-2 py-1 shadow-inner max-w-xs mx-auto">
          <button
            onClick={handlePrevDay}
            className="p-1.5 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 flex-shrink-0"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onDateChange(todayStr)}
            className="flex-1 px-3 py-1 text-xs sm:text-sm font-bold text-slate-100 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{isToday ? 'Today' : formattedDate}</span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95 flex-shrink-0"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenGoals}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 flex-shrink-0"
          title="Target Goals & AI Plan Settings"
          aria-label="Target Goals & AI Plan Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
