'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DailyProgress } from '@/components/DailyProgress';
import { CameraUpload } from '@/components/CameraUpload';
import { FoodLogFeed } from '@/components/FoodLogFeed';
import { WeeklyChart } from '@/components/WeeklyChart';
import { MealModal } from '@/components/MealModal';
import { GoalsModal } from '@/components/GoalsModal';
import { useMacroTracker } from '@/hooks/useMacroTracker';
import { FoodAnalysisResponse, Meal } from '@/types/tracker';
import { AlertCircle, X } from 'lucide-react';

export default function DashboardPage() {
  const {
    meals,
    filteredMeals,
    goals,
    selectedDate,
    setSelectedDate,
    todaySummary,
    addMeal,
    updateMeal,
    deleteMeal,
    updateGoals,
    get7DayHistory,
    isLoaded,
  } = useMacroTracker();

  // Modals state
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<
    (FoodAnalysisResponse & { imageUrl?: string; mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' }) | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      mealName: 'Custom Meal',
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
        {/* Daily Summary Progress Rings & Bars */}
        <DailyProgress summary={todaySummary} goals={goals} />

        {/* Photo Meal Logger */}
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
      />
    </div>
  );
}
