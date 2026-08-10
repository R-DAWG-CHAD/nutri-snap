'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { FoodAnalysisResponse } from '@/types/tracker';

interface CameraUploadProps {
  onAnalysisComplete: (result: FoodAnalysisResponse, imageUrl: string) => void;
  onError: (errorMessage: string) => void;
}

export function CameraUpload({ onAnalysisComplete, onError }: CameraUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
    e.target.value = '';
  };

  const processImageFile = async (file: File) => {
    try {
      setIsAnalyzing(true);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;
      setPreviewSrc(dataUrl);

      const formData = new FormData();
      formData.append('image', file);
      if (imageCaption.trim()) {
        formData.append('imageCaption', imageCaption.trim());
      }

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to analyze food image.');
      }

      onAnalysisComplete(data as FoodAnalysisResponse, dataUrl);
    } catch (err: any) {
      console.error('Analysis error:', err);
      onError(err.message || 'An error occurred while scanning the food image.');
    } finally {
      setIsAnalyzing(false);
      setPreviewSrc(null);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 bg-slate-900/60 p-4 transition-all duration-300 shadow-xl max-w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2.5 max-w-full">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/10 flex-shrink-0">
            <Camera className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="max-w-full px-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center justify-center gap-1.5">
              <span>Snap or Upload Food</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              AI estimates portions, calories, and macros from photo
            </p>
          </div>

          {/* Optional Caption/Note input */}
          <div className="w-full max-w-xs relative mt-0.5 px-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Optional note e.g. cooked in 1 tbsp butter..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-[11px] focus:outline-none focus:border-emerald-400 shadow-inner truncate"
            />
          </div>

          {/* Action buttons fitting container width */}
          <div className="flex items-center justify-center gap-2.5 mt-1 w-full max-w-xs px-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 min-w-0"
            >
              <Camera className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
              <span className="truncate">Take Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 min-w-0"
            >
              <Upload className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="truncate">Choose File</span>
            </button>
          </div>
        </div>
      </div>

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm glass-modal rounded-3xl p-6 border border-emerald-500/30 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {previewSrc && (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden mb-4 border border-white/20 shadow-inner">
                <img
                  src={previewSrc}
                  alt="Analyzing preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_15px_#10b981] animate-laser-scan" />
              </div>
            )}

            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Analyzing Meal with Gemini...</span>
            </div>

            <p className="text-xs text-slate-400 truncate max-w-full">
              {imageCaption ? `Factoring in: "${imageCaption}"` : 'Identifying ingredients, portion weights, and macro ratios'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
