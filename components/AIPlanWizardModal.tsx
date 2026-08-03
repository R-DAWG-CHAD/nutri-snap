'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Flame,
  Dumbbell,
  Wheat,
  Beef,
  Scale,
  Calendar,
  Zap,
  TrendingDown,
  Target,
} from 'lucide-react';
import { DailyGoals } from '@/types/tracker';

interface AIPlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (goals: DailyGoals) => void;
}

export function AIPlanWizardModal({
  isOpen,
  onClose,
  onApplyPlan,
}: AIPlanWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('imperial');

  // Form Inputs
  const [ageInput, setAgeInput] = useState<string>('28');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weightInput, setWeightInput] = useState<string>('180');
  const [heightInput, setHeightInput] = useState<string>('70');

  // Goal & Pace Inputs
  const [fitnessGoal, setFitnessGoal] = useState<
    'fat_loss' | 'maintenance' | 'muscle_gain' | 'recomp'
  >('fat_loss');
  const [goalWeightInput, setGoalWeightInput] = useState<string>('165');
  const [weeklyPaceKg, setWeeklyPaceKg] = useState<number>(0.5);
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'liftpulse_planned'
  >('moderate');

  // LiftPulse Auto-Detected Bridge Profile
  const [liftpulseData, setLiftpulseData] = useState<{
    workoutSummary: string;
    totalAdditionalExpenditure: number;
    dailySteps: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nutrisnap_activity_sync_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.totalAdditionalExpenditure > 0) {
            setLiftpulseData(parsed);
            setActivityLevel('liftpulse_planned'); // Default to LiftPulse Planned Baseline if available!
          }
        }
      } catch (e) {
        console.error('Failed to read LiftPulse sync data in NutriSnap', e);
      }
    }
  }, [isOpen]);

  // Step 3 Preferences
  const [dietPreference, setDietPreference] = useState<
    'balanced' | 'high_protein' | 'low_carb' | 'keto' | 'vegan'
  >('balanced');

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [planResult, setPlanResult] = useState<{
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    bmr: number;
    tdee: number;
    projectedWeeks: number;
    projectedEndDateLabel: string;
    summaryExplanation: string;
    dietaryTips: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Conversion helpers
  const currentWeightNum = Number(weightInput) || 75;
  const goalWeightNum = Number(goalWeightInput) || 70;

  const currentWeightKg = unit === 'imperial' ? currentWeightNum / 2.20462 : currentWeightNum;
  const goalWeightKg = unit === 'imperial' ? goalWeightNum / 2.20462 : goalWeightNum;
  const heightCm = unit === 'imperial' ? (Number(heightInput) || 68) * 2.54 : (Number(heightInput) || 175);

  const weightDiffKg = Math.max(0, currentWeightKg - goalWeightKg);
  const estimatedWeeks = weeklyPaceKg > 0 ? Math.ceil(weightDiffKg / weeklyPaceKg) : 0;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + estimatedWeeks * 7);
  const formattedProjectedDate = projectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dailyDeficitKcal = Math.round((weeklyPaceKg * 7700) / 7);

  const handleUnitToggle = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;
    if (newUnit === 'imperial') {
      setWeightInput(String(Math.round(currentWeightNum * 2.20462)));
      setGoalWeightInput(String(Math.round(goalWeightNum * 2.20462)));
      setHeightInput(String(Math.round((Number(heightInput) || 175) / 2.54)));
    } else {
      setWeightInput(String(Math.round(currentWeightNum / 2.20462)));
      setGoalWeightInput(String(Math.round(goalWeightNum / 2.20462)));
      setHeightInput(String(Math.round((Number(heightInput) || 70) * 2.54)));
    }
    setUnit(newUnit);
  };

  const handleGenerateAIPlan = async () => {
    try {
      setIsGenerating(true);
      const payload: any = {
        age: Number(ageInput) || 28,
        gender,
        weightKg: Math.round(currentWeightKg),
        heightCm: Math.round(heightCm),
        activityLevel,
        fitnessGoal,
        goalWeightKg: fitnessGoal === 'fat_loss' ? Math.round(goalWeightKg) : undefined,
        weeklyPaceKg: fitnessGoal === 'fat_loss' ? weeklyPaceKg : undefined,
        dietPreference,
      };

      // If user selected LiftPulse planned baseline, pass full liftpulse profile
      if (activityLevel === 'liftpulse_planned' && liftpulseData) {
        payload.liftpulseProfile = liftpulseData;
      }

      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan.');
      }

      setPlanResult(data);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating AI macro plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!planResult) return;
    onApplyPlan({
      calories: planResult.dailyCalories,
      proteinGrams: planResult.proteinGrams,
      carbsGrams: planResult.carbsGrams,
      fatGrams: planResult.fatGrams,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg glass-modal rounded-3xl border border-white/10 p-6 shadow-2xl relative my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>AI Macro Plan Generator</span>
              </h2>
              <p className="text-[11px] text-slate-400">Step {step} of 3 • Custom AI Nutrition Calculator</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Personal Metrics */}
        {step === 1 && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Personal Metrics</span>
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('imperial')}
                  className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                    unit === 'imperial' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Imperial (lbs/in)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('metric')}
                  className={`px-2.5 py-0.5 rounded font-semibold transition-all ${
                    unit === 'metric' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Metric (kg/cm)
                </button>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      gender === g
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Height ({unit === 'metric' ? 'cm' : 'inches'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Current Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Weight ({unit === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                type="number"
                min="1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={unit === 'metric' ? 'e.g. 80' : 'e.g. 180'}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-emerald-300 font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>Next: Fitness Goal & Pace</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* STEP 2: Goal & Activity Level (with LiftPulse Auto-Detect) */}
        {step === 2 && (
          <div className="mt-5 flex flex-col gap-4">
            {/* Fitness Goal selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fitness Goal</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'fat_loss', label: '🔥 Fat Loss / Weight Cut' },
                  { id: 'muscle_gain', label: '💪 Muscle Gain / Bulk' },
                  { id: 'recomp', label: '⚡ Body Recomposition' },
                  { id: 'maintenance', label: '⚖️ Weight Maintenance' },
                ].map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setFitnessGoal(g.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      fitnessGoal === g.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC FAT LOSS SLIDERS */}
            {fitnessGoal === 'fat_loss' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col gap-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    Fat Loss Target & Pace Controls
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Target Goal Weight ({unit === 'metric' ? 'kg' : 'lbs'})</span>
                    <input
                      type="number"
                      value={goalWeightInput}
                      onChange={(e) => setGoalWeightInput(e.target.value)}
                      className="w-24 px-2 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-400 font-bold text-xs text-right focus:outline-none"
                    />
                  </div>
                  <input
                    type="range"
                    min={unit === 'metric' ? 35 : 75}
                    max={currentWeightNum - 1}
                    step="1"
                    value={goalWeightNum}
                    onChange={(e) => setGoalWeightInput(e.target.value)}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Weight Loss Speed / Pace</span>
                    <span className="text-cyan-400 font-bold">
                      {weeklyPaceKg} kg/week ({ (weeklyPaceKg * 2.20462).toFixed(1) } lbs/wk)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={weeklyPaceKg}
                    onChange={(e) => setWeeklyPaceKg(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Activity Level Selector with LiftPulse Auto-Detect */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Level Baseline</label>
              
              {liftpulseData && (
                <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <Target className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-cyan-300 block">LiftPulse Planned Baseline Detected</span>
                      <span className="text-[11px] text-slate-400">{liftpulseData.workoutSummary} (+{liftpulseData.totalAdditionalExpenditure} kcal/day)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivityLevel('liftpulse_planned')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      activityLevel === 'liftpulse_planned'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {activityLevel === 'liftpulse_planned' ? 'Selected' : 'Use This'}
                  </button>
                </div>
              )}

              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {liftpulseData && (
                  <option value="liftpulse_planned">
                    🏋️ LiftPulse Planned Regiment (+{liftpulseData.totalAdditionalExpenditure} kcal/day)
                  </option>
                )}
                <option value="sedentary">Sedentary (Office job, little exercise)</option>
                <option value="light">Lightly Active (Light exercise 1-3 days/wk)</option>
                <option value="moderate">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                <option value="active">Very Active (Hard exercise 6-7 days/wk)</option>
                <option value="very_active">Extra Active (Athlete, physical job + training)</option>
              </select>
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>Next: Dietary Preference & Calculate</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Dietary Preference & AI Result Preview */}
        {step === 3 && (
          <div className="mt-5 flex flex-col gap-4">
            {!planResult ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dietary Preference / Macro Ratio Focus
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'balanced', label: '🥗 Balanced (40C / 30P / 30F)' },
                      { id: 'high_protein', label: '🥩 High Protein (Lean & Fit)' },
                      { id: 'low_carb', label: '🥑 Low Carb (Moderate Fat)' },
                      { id: 'keto', label: '🧀 Ketogenic (Very Low Carb)' },
                      { id: 'vegan', label: '🌱 Plant-Based Vegan' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => setDietPreference(d.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                          dietPreference === d.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerateAIPlan}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-90 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gemini Calculating Plan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        <span>Generate AI Macro Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* RESULTS PREVIEW */
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-violet-950/60 via-slate-900 to-slate-900 border border-violet-500/30 flex flex-col gap-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-violet-400" /> Recommended Target
                    </span>
                    <span className="text-2xl font-black text-white">
                      {planResult.dailyCalories.toLocaleString()} <span className="text-xs font-medium text-slate-400">kcal/day</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-2">
                    {planResult.summaryExplanation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>BMR: <span className="font-bold text-slate-200">{planResult.bmr} kcal</span></div>
                    <div>TDEE: <span className="font-bold text-slate-200">{planResult.tdee} kcal</span></div>
                  </div>
                </div>

                {/* Recommended Macros Breakdown */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <Dumbbell className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <span className="block text-[11px] font-bold text-slate-400">Protein</span>
                    <span className="text-lg font-black text-emerald-400">{planResult.proteinGrams}g</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                    <Wheat className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="block text-[11px] font-bold text-slate-400">Carbs</span>
                    <span className="text-lg font-black text-cyan-400">{planResult.carbsGrams}g</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <Beef className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="block text-[11px] font-bold text-slate-400">Fat</span>
                    <span className="text-lg font-black text-amber-400">{planResult.fatGrams}g</span>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPlanResult(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10"
                  >
                    Recalculate
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply Plan as Daily Goals</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
