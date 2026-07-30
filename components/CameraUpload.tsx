'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { FoodAnalysisResponse } from '@/types/tracker';

interface CameraUploadProps {
  onAnalysisComplete: (result: FoodAnalysisResponse, imageUrl: string) => void;
  onError: (errorMessage: string) => void;
}

export function CameraUpload({ onAnalysisComplete, onError }: CameraUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
    // Reset file input so user can re-upload same file if desired
    e.target.value = '';
  };

  const processImageFile = async (file: File) => {
    try {
      setIsAnalyzing(true);
      
      // Read local image preview base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;
      setPreviewSrc(dataUrl);

      // Submit file via FormData to API route
      const formData = new FormData();
      formData.append('image', file);

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
    <div className="w-full">
      {/* Hidden file input supporting mobile camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload Trigger Area */}
      <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 bg-slate-900/60 p-6 transition-all duration-300 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/10">
            <Camera className="w-8 h-8 text-emerald-400" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-center gap-1.5">
              <span>Snap or Upload Food</span>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              AI instantly estimates portions, calories, protein, carbs, and fat
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Take Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Choose File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Scanning Modal Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm glass-modal rounded-3xl p-6 border border-emerald-500/30 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Scanning line animation over preview image */}
            {previewSrc && (
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden mb-4 border border-white/20 shadow-inner">
                <img
                  src={previewSrc}
                  alt="Analyzing preview"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* Laser scan bar */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_15px_#10b981] animate-laser-scan" />
              </div>
            )}

            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-1">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Meal with Gemini...</span>
            </div>

            <p className="text-xs text-slate-400">
              Identifying ingredients, portion weights, and macro ratios
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
