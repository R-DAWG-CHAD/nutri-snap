'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface WeeklyChartProps {
  data: Array<{
    dateLabel: string;
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    calorieGoal: number;
  }>;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const [viewMode, setViewMode] = useState<'calories' | 'macros'>('calories');

  return (
    <section className="w-full max-w-full overflow-hidden glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl">
      <div className="flex flex-row items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">7-Day Trends</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Intake consistency</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 flex-shrink-0">
          <button
            onClick={() => setViewMode('calories')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              viewMode === 'calories'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setViewMode('macros')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              viewMode === 'macros'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Macros (g)
          </button>
        </div>
      </div>

      <div className="w-full h-56 sm:h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'calories' ? (
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="calorieBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
              />
              <Bar dataKey="calories" name="Calories (kcal)" fill="url(#calorieBarGrad)" radius={[6, 6, 0, 0]} />
              <Line
                type="monotone"
                dataKey="calorieGoal"
                name="Daily Target"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }}
                iconType="circle"
              />
              <Bar dataKey="protein" name="Protein (g)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="carbs" name="Carbs (g)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fat" name="Fat (g)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
