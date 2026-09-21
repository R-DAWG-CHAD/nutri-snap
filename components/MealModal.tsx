'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Sparkles,
  Flame,
  Dumbbell,
  Wheat,
  Beef,
  MessageSquareText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Camera,
  Send,
  HelpCircle,
} from 'lucide-react';
import { FoodAnalysisResponse, Meal, ChatMessage } from '@/types/tracker';
import { compressFileForUpload } from '@/utils/compressImage';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  initialData?: Partial<
    FoodAnalysisResponse & {
      imageUrl?: string;
      mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      notes?: string;
      chatHistory?: ChatMessage[];
    }
  >;
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
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [confidence, setConfidence] = useState<number>(0.9);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // AI Reasoning & Clarification Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reasoning, setReasoning] = useState<string | undefined>(undefined);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatAttachedImage, setChatAttachedImage] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [justUpdatedBadge, setJustUpdatedBadge] = useState(false);

  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Natural Language Description State
  const [textDescription, setTextDescription] = useState('');
  const [isEstimatingText, setIsEstimatingText] = useState(false);
  const [estimatorError, setEstimatorError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setMealName(initialData.mealName || '');
      setCalories(typeof initialData.calories === 'number' ? initialData.calories : '');
      setProtein(typeof initialData.proteinGrams === 'number' ? initialData.proteinGrams : '');
      setCarbs(typeof initialData.carbsGrams === 'number' ? initialData.carbsGrams : '');
      setFat(typeof initialData.fatGrams === 'number' ? initialData.fatGrams : '');
      setConfidence(initialData.confidenceScore ?? 0.9);
      setImageUrl(initialData.imageUrl);
      setReasoning(initialData.reasoning);
      setAssumptions(initialData.assumptions || []);
      setTextDescription('');

      // Auto-open chat if reasoning or assumptions exist
      if (initialData.reasoning || (initialData.assumptions && initialData.assumptions.length > 0)) {
        setIsChatOpen(true);
      } else {
        setIsChatOpen(false);
      }

      // Populate initial AI welcoming/reasoning message in chat
      if (initialData.chatHistory && initialData.chatHistory.length > 0) {
        setChatMessages(initialData.chatHistory);
      } else if (initialData.reasoning || initialData.clarificationQuestion) {
        let initialText = initialData.reasoning || 'I analyzed your meal and estimated calories and macronutrients.';
        if (initialData.clarificationQuestion) {
          initialText += `\n\n💡 Follow-up Question: ${initialData.clarificationQuestion}`;
        }
        setChatMessages([
          {
            id: 'init-' + Date.now(),
            role: 'assistant',
            text: initialText,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setChatMessages([]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

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
      setCalories(data.calories ?? 0);
      setProtein(data.proteinGrams ?? 0);
      setCarbs(data.carbsGrams ?? 0);
      setFat(data.fatGrams ?? 0);
      setConfidence(data.confidenceScore ?? 0.95);
      setReasoning(data.reasoning);
      setAssumptions(data.assumptions || []);

      if (data.reasoning) {
        setIsChatOpen(true);
        setChatMessages([
          {
            id: 'init-text-' + Date.now(),
            role: 'assistant',
            text: data.reasoning,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setEstimatorError(err.message || 'Error estimating nutrition');
    } finally {
      setIsEstimatingText(false);
    }
  };

  const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress follow-up photo to ~200KB before attaching
      const { dataUrl } = await compressFileForUpload(file, 1200, 1200, 0.8);
      setChatAttachedImage(dataUrl);
    } catch (err) {
      console.error('Failed to compress attached image', err);
    }
    e.target.value = '';
  };

  const handleSendChatMessage = async () => {
    if ((!chatInput.trim() && !chatAttachedImage) || isSendingChat) return;

    const userMsgText = chatInput.trim() || (chatAttachedImage ? 'Uploaded follow-up photo' : '');
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: userMsgText,
      imageUrl: chatAttachedImage || undefined,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    const sendingImage = chatAttachedImage;
    setChatAttachedImage(null);
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/chat-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory.map((m) => ({
            role: m.role,
            text: m.text,
            imageUrl: m.imageUrl,
          })),
          currentMeal: {
            mealName,
            calories: calories === '' ? 0 : Number(calories),
            proteinGrams: protein === '' ? 0 : Number(protein),
            carbsGrams: carbs === '' ? 0 : Number(carbs),
            fatGrams: fat === '' ? 0 : Number(fat),
            originalImageUrl: imageUrl,
          },
          userMessage: userMsgText,
          newImage: sendingImage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to get chat response.');
      }

      const assistantMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        text: data.reply,
        updatedMacros: data.updatedMacros,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      // Automatically sync updated macros to the input fields
      if (data.updatedMacros) {
        if (data.updatedMacros.mealName) setMealName(data.updatedMacros.mealName);
        if (data.updatedMacros.calories !== undefined) setCalories(data.updatedMacros.calories);
        if (data.updatedMacros.proteinGrams !== undefined) setProtein(data.updatedMacros.proteinGrams);
        if (data.updatedMacros.carbsGrams !== undefined) setCarbs(data.updatedMacros.carbsGrams);
        if (data.updatedMacros.fatGrams !== undefined) setFat(data.updatedMacros.fatGrams);

        // Flash green badge
        setJustUpdatedBadge(true);
        setTimeout(() => setJustUpdatedBadge(false), 3000);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: `Sorry, I had trouble adjusting that: ${err.message || 'Please try again.'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      mealName: mealName || 'Custom Meal',
      estimatedWeightGrams: 0,
      calories: calories === '' ? 0 : Number(calories),
      proteinGrams: protein === '' ? 0 : Number(protein),
      carbsGrams: carbs === '' ? 0 : Number(carbs),
      fatGrams: fat === '' ? 0 : Number(fat),
      confidenceScore: confidence,
      imageUrl,
      reasoning,
      assumptions,
      chatHistory: chatMessages.length > 0 ? chatMessages : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md glass-modal rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl relative my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                {isEditingExisting ? 'Edit Meal Entry' : 'Log Meal Entry'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Powered by Gemini 3.8 Flash
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
        {!imageUrl && (
          <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col gap-2 shadow-inner">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4" />
              <span>Describe What You Ate (AI Auto-Estimate)</span>
            </span>

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
                placeholder="e.g. 2 eggs, 2 slices toast & coffee"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                disabled={isEstimatingText || !textDescription.trim()}
                onClick={handleTextEstimate}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
              >
                {isEstimatingText ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>Estimate</span>
              </button>
            </div>

            {estimatorError && (
              <span className="text-[11px] text-red-400 font-medium">{estimatorError}</span>
            )}
          </div>
        )}

        {/* Meal Photo Preview */}
        {imageUrl && (
          <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden border border-white/10 shadow-inner mt-3.5">
            <img
              src={imageUrl}
              alt={mealName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            {confidence && (
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3 h-3" />
                <span>{Math.round(confidence * 100)}% Match (gemini-3.8-flash)</span>
              </div>
            )}
          </div>
        )}

        {/* Collapsible AI Breakdown & Clarification Chat Drawer */}
        <div className="mt-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 overflow-hidden shadow-md">
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-200 truncate">
                AI Breakdown & Clarification Chat
              </span>
              {justUpdatedBadge && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[10px] font-black animate-pulse">
                  Synced ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[10px] hidden xs:inline">{isChatOpen ? 'Hide' : 'Clarify / Ask'}</span>
              {isChatOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isChatOpen && (
            <div className="p-3 border-t border-white/10 flex flex-col gap-2.5 bg-slate-950/60">
              {/* Assumptions Tags */}
              {assumptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-semibold text-slate-400">Assumptions:</span>
                  {assumptions.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-white/10"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {/* Chat Message Scroll Area */}
              <div className="max-h-44 overflow-y-auto flex flex-col gap-2 pr-1 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="py-2 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ask why calories were chosen, or tell Gemini to remove oil/change portions!</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[88%] rounded-2xl p-2.5 shadow-sm ${
                        msg.role === 'user'
                          ? 'ml-auto bg-emerald-600/20 text-emerald-200 border border-emerald-500/30'
                          : 'mr-auto bg-slate-900 text-slate-200 border border-white/10'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Attached"
                          className="w-24 h-24 object-cover rounded-xl mb-1.5 border border-white/10"
                        />
                      )}
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{msg.text}</p>
                      {msg.updatedMacros && (
                        <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                          <span>Updated: {msg.updatedMacros.calories} kcal</span>
                          <span>(P:{msg.updatedMacros.proteinGrams}g, C:{msg.updatedMacros.carbsGrams}g, F:{msg.updatedMacros.fatGrams}g)</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isSendingChat && (
                  <div className="mr-auto bg-slate-900 text-emerald-400 text-[11px] rounded-2xl p-2.5 border border-white/10 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini 3.8 Flash is recalibrating...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Image Attachment Preview */}
              {chatAttachedImage && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/50 shadow-md">
                  <img src={chatAttachedImage} alt="Follow up" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setChatAttachedImage(null)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-slate-950/80 rounded-full text-white hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleChatFileSelect}
                />

                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10 flex-shrink-0"
                  title="Attach follow-up photo (e.g. side angle, label)"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="e.g. 'no oil was used', 'double rice'..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400 min-w-0"
                />

                <button
                  type="button"
                  disabled={isSendingChat || (!chatInput.trim() && !chatAttachedImage)}
                  onClick={handleSendChatMessage}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all disabled:opacity-40 flex-shrink-0 active:scale-95"
                  title="Send clarification to Gemini"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-3.5 flex flex-col gap-3.5">
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
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Calories Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-violet-400" />
                <span>Calories (kcal)</span>
              </span>
              {justUpdatedBadge && (
                <span className="text-[10px] text-emerald-400 font-bold animate-pulse">
                  Adjusted by AI
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-violet-300 font-bold text-base focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Macros: Protein, Carbs, Fat */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Protein */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                <span>Protein (g)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Carbs */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30">
              <label className="block text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
                <Wheat className="w-3 h-3" />
                <span>Carbs (g)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Fat */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/30">
              <label className="block text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                <Beef className="w-3 h-3" />
                <span>Fat (g)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
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
