'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Scale, Flame, Dumbbell, Wheat, Beef, MessageSquareText, Loader2 } from 'lucide-react';
import { FoodAnalysisResponse, Meal } from '@/types/tracker';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  initialData?: Partial<FoodAnalysisResponse & { imageUrl?: string; mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' }>;
  isEditingExisting?: boolean;
}

export function MealModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditingExisting = false,
}: MealModalProps) {
  const [mealName, setMealName] = useState('');
  const [weight, setWeight] = useState<number>(200);
  const [calories, setCalories] = useState<number>(350);
  const [protein, setProtein] = useState<number>(20);
  const [carbs, setCarbs] = useState<number>(30);
  const [fat, setFat] = useState<number>(12);
  const [confidence, setConfidence] = useState<number>(0.9);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Natural Language Description State
  const [textDescription, setTextDescription] = useState('');
  const [isEstimatingText, setIsEstimatingText] = useState(false);
  const [estimatorError, setEstimatorError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setMealName(initialData.mealName || '');
      setWeight(initialData.estimatedWeightGrams || 200);
      setCalories(initialData.calories || 0);
      setProtein(initialData.proteinGrams || 0);
      setCarbs(initialData.carbsGrams || 0);
      setFat(initialData.fatGrams || 0);
      setConfidence(initialData.confidenceScore || 0.9);
      setImageUrl(initialData.imageUrl);
      setMealType(initialData.mealType || 'lunch');
      setTextDescription('');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleTextEstimate = async () => {
    if (!textDescription.trim()) return;
    try {
      setIsEstimatingText(true);
      setEstimatorError(null);

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textDescription }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to estimate nutrition from text.');
      }

      setMealName(data.mealName || textDescription);
      setWeight(data.estimatedWeightGrams || 200);
      setCalories(data.calories || 0);
      setProtein(data.proteinGrams || 0);
      setCarbs(data.carbsGrams || 0);
      setFat(data.fatGrams || 0);
      setConfidence(data.confidenceScore || 0.95);
    } catch (err: any) {
      console.error(err);
      setEstimatorError(err.message || 'Error estimating nutrition');
    } finally {
      setIsEstimatingText(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      mealName: mealName || 'Custom Meal',
      estimatedWeightGrams: Number(weight),
      calories: Number(calories),
      proteinGrams: Number(protein),
      carbsGrams: Number(carbs),
      fatGrams: Number(fat),
      confidenceScore: confidence,
      mealType,
      imageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md glass-modal rounded-3xl border border-white/10 p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isEditingExisting ? 'Edit Meal Entry' : 'Log Meal Entry'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Use AI text estimation or fine-tune exact nutrition numbers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Text Description Estimator Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col gap-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4" />
              <span>Describe What You Ate (AI Auto-Estimate)</span>
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTextEstimate();
                }
              }}
              placeholder="e.g. 2 eggs, 2 slices whole wheat toast & coffee"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
            />

            <button
              type="button"
              disabled={isEstimatingText || !textDescription.trim()}
              onClick={handleTextEstimate}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
            >
              {isEstimatingText ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Estimate</span>
            </button>
          </div>

          {estimatorError && (
            <span className="text-[11px] text-red-400 font-medium">{estimatorError}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Image & Confidence Badge */}
          {imageUrl && (
            <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
              <img
                src={imageUrl}
                alt={mealName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              {confidence && (
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3 h-3" />
                  <span>{Math.round(confidence * 100)}% AI Match</span>
                </div>
              )}
            </div>
          )}

          {/* Meal Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Meal Name
            </label>
            <input
              type="text"
              required
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Scrambled Eggs & Toast"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Meal Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    mealType === type
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Weight & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span>Portion (grams)</span>
              </label>
              <input
                type="number"
                min="1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-violet-400" />
                <span>Calories (kcal)</span>
              </label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-violet-300 font-bold text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Macros: Protein, Carbs, Fat */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Protein */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                <span>Protein (g)</span>
              </label>
              <input
                type="number"
                min="0"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Carbs */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
              <label className="block text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
                <Wheat className="w-3 h-3" />
                <span>Carbs (g)</span>
              </label>
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Fat */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
              <label className="block text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                <Beef className="w-3 h-3" />
                <span>Fat (g)</span>
              </label>
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Meal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
