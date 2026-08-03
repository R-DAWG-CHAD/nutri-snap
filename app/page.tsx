'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DailyProgress } from '@/components/DailyProgress';
import { CameraUpload } from '@/components/CameraUpload';
import { FoodLogFeed } from '@/components/FoodLogFeed';
import { WeeklyChart } from '@/components/WeeklyChart';
import { MealModal } from '@/components/MealModal';
import { GoalsModal } from '@/components/GoalsModal';
import { AIPlanWizardModal } from '@/components/AIPlanWizardModal';
import { WeighInModal } from '@/components/WeighInModal';
import { MacroWarnings } from '@/components/MacroWarnings';
import { EveningProteinAssistant } from '@/components/EveningProteinAssistant';
import { useMacroTracker } from '@/hooks/useMacroTracker';
import { FoodAnalysisResponse, Meal } from '@/types/tracker';
import { AlertCircle, X } from 'lucide-react';

export default function DashboardPage() {
  const {
    meals,
    filteredMeals,
    weighIns,
    goals,
    selectedDate,
    setSelectedDate,
    todaySummary,
    addMeal,
    updateMeal,
    deleteMeal,
    addWeighIn,
    deleteWeighIn,
    updateGoals,
    get7DayHistory,
    exportData,
    importData,
    isLoaded,
  } = useMacroTracker();

  // Modals state
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isAIPlanOpen, setIsAIPlanOpen] = useState(false);
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<
    (FoodAnalysisResponse & { imageUrl?: string; mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' }) | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LiftPulse Sync Banner State
  const [liftpulseSyncData, setLiftpulseSyncData] = useState<{
    workoutSummary: string;
    totalAdditionalExpenditure: number;
    dailySteps: number;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nutrisnap_activity_sync_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.totalAdditionalExpenditure > 0) {
            setLiftpulseSyncData(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Handle successful image scan from CameraUpload
  const handleAnalysisComplete = (
    result: FoodAnalysisResponse,
    imageUrl: string
  ) => {
    setEditingMeal(null);
    setPendingAnalysis({ ...result, imageUrl });
    setIsMealModalOpen(true);
  };

  // Handle manual meal entry trigger
  const handleAddManualClick = () => {
    setEditingMeal(null);
    setPendingAnalysis({
      mealName: '',
      estimatedWeightGrams: 200,
      calories: 350,
      proteinGrams: 25,
      carbsGrams: 35,
      fatGrams: 12,
      confidenceScore: 1.0,
      imageUrl: undefined,
    });
    setIsMealModalOpen(true);
  };

  // Handle clicking edit on existing log item
  const handleEditClick = (meal: Meal) => {
    setEditingMeal(meal);
    setPendingAnalysis({
      mealName: meal.mealName,
      estimatedWeightGrams: meal.estimatedWeightGrams,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      confidenceScore: meal.confidenceScore,
      imageUrl: meal.imageUrl,
      mealType: meal.mealType,
    });
    setIsMealModalOpen(true);
  };

  // Save handler for MealModal
  const handleSaveMeal = (mealData: Omit<Meal, 'id' | 'timestamp'>) => {
    if (editingMeal) {
      updateMeal({
        ...editingMeal,
        ...mealData,
      });
    } else {
      addMeal(mealData);
    }
    setIsMealModalOpen(false);
    setEditingMeal(null);
    setPendingAnalysis(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="flex flex-col items-center gap-3 text-emerald-400">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading NutriSnap AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-16">
      {/* Top Navbar */}
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenGoals={() => setIsGoalsOpen(true)}
        onOpenAIPlan={() => setIsAIPlanOpen(true)}
        onOpenWeighIn={() => setIsWeighInOpen(true)}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-md mx-auto w-full px-4 mt-3">
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Mobile Dashboard Container */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-5">
        {/* LiftPulse Activity Sync Banner */}
        {liftpulseSyncData && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/40 shadow-xl flex items-center justify-between gap-2 animate-in fade-in">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                🏋️ LiftPulse Activity Synced
              </span>
              <h4 className="text-xs font-bold text-white mt-1">
                {liftpulseSyncData.workoutSummary} (+{liftpulseSyncData.totalAdditionalExpenditure} kcal/day)
              </h4>
              <p className="text-[11px] text-slate-400">Target steps: {liftpulseSyncData.dailySteps?.toLocaleString() || 10000} steps/day</p>
            </div>
            <button
              onClick={() => setIsAIPlanOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-slate-950 text-xs font-black rounded-xl shadow-md whitespace-nowrap"
            >
              Recalculate Macros
            </button>
          </div>
        )}

        {/* Daily Summary Progress Rings & Bars */}
        <DailyProgress summary={todaySummary} goals={goals} />

        {/* Multi-Day Macro Warnings & Insights */}
        <MacroWarnings meals={meals} goals={goals} />

        {/* Smart Evening Protein Assistant */}
        <EveningProteinAssistant
          todaySummary={todaySummary}
          goals={goals}
          onQuickLog={(meal) => addMeal(meal)}
        />

        {/* Photo Meal Logger & Scanner */}
        <CameraUpload
          onAnalysisComplete={handleAnalysisComplete}
          onError={(err) => setErrorMessage(err)}
        />

        {/* Today's Log Feed */}
        <FoodLogFeed
          meals={filteredMeals}
          onEdit={handleEditClick}
          onDelete={deleteMeal}
          onAddManual={handleAddManualClick}
        />

        {/* 7-Day Intake Trend Chart */}
        <WeeklyChart data={get7DayHistory()} />
      </main>

      {/* Modals */}
      <MealModal
        isOpen={isMealModalOpen}
        onClose={() => {
          setIsMealModalOpen(false);
          setEditingMeal(null);
          setPendingAnalysis(null);
        }}
        onSave={handleSaveMeal}
        initialData={pendingAnalysis || undefined}
        isEditingExisting={!!editingMeal}
      />

      <GoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={goals}
        onSave={updateGoals}
        onOpenAIPlan={() => setIsAIPlanOpen(true)}
        onExport={exportData}
        onImport={importData}
      />

      <AIPlanWizardModal
        isOpen={isAIPlanOpen}
        onClose={() => setIsAIPlanOpen(false)}
        onApplyPlan={updateGoals}
      />

      <WeighInModal
        isOpen={isWeighInOpen}
        onClose={() => setIsWeighInOpen(false)}
        weighIns={weighIns}
        goals={goals}
        onAddWeighIn={addWeighIn}
        onDeleteWeighIn={deleteWeighIn}
        onUpdateGoals={updateGoals}
      />
    </div>
  );
}
