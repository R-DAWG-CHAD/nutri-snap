import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      age = 28,
      gender = 'male',
      weightKg = 75,
      heightCm = 175,
      activityLevel = 'moderate',
      fitnessGoal = 'fat_loss',
      goalWeightKg,
      weeklyPaceKg = 0.5,
      dietPreference = 'balanced',
    } = body;

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a strict, evidence-based clinical dietitian and sports nutritionist AI.
Calculate an accurate, realistic daily caloric target and macronutrient split (Protein, Carbohydrates, Fats in grams) based on the user's metrics:

User Profile:
- Age: ${age} years
- Gender: ${gender}
- Current Weight: ${weightKg} kg
- Height: ${heightCm} cm
- Activity Level: ${activityLevel}
- Fitness Goal: ${fitnessGoal}
${fitnessGoal === 'fat_loss' && goalWeightKg ? `- Goal Weight: ${goalWeightKg} kg (Desired loss: ${Math.max(0, weightKg - goalWeightKg)} kg)` : ''}
${fitnessGoal === 'fat_loss' && weeklyPaceKg ? `- Target Pace: ${weeklyPaceKg} kg / week` : ''}
- Dietary Preference: ${dietPreference}

Calculation Rules (CRITICAL - DO NOT OVERESTIMATE CALORIES):
1. Calculate BMR strictly using Mifflin-St Jeor:
   - Male: (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
   - Female: (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
2. Calculate TDEE using CONSERVATIVE activity factors:
   - Sedentary: BMR * 1.15
   - Light: BMR * 1.25
   - Moderate: BMR * 1.35
   - Active: BMR * 1.45
   - Very Active: BMR * 1.55
3. For fat_loss:
   - Subtract approx 550 kcal/day per 0.5 kg/week target loss from TDEE.
   - Be conservative: Most people overestimate activity. Recommended fat loss intake should be realistic and lean (typically 1400 - 1800 kcal for females, 1600 - 2000 kcal for males depending on size).
4. Assign macro splits in grams according to ${dietPreference}:
   - Ensure protein is sufficient (1.6 - 2.2g per kg of body weight for muscle retention).
5. Return ONLY a valid JSON object matching this schema:
{
  "dailyCalories": 1650,
  "proteinGrams": 150,
  "carbsGrams": 150,
  "fatGrams": 50,
  "bmr": 1650,
  "tdee": 2150,
  "projectedWeeks": 12,
  "projectedEndDateLabel": "October 22, 2026",
  "summaryExplanation": "Conservative, realistic caloric deficit calculation designed to prevent plateau.",
  "dietaryTips": [
    "Tip 1 for success",
    "Tip 2 for success",
    "Tip 3 for success"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    const result = {
      dailyCalories: Math.round(Number(parsedData.dailyCalories) || 1700),
      proteinGrams: Math.round(Number(parsedData.proteinGrams) || 140),
      carbsGrams: Math.round(Number(parsedData.carbsGrams) || 160),
      fatGrams: Math.round(Number(parsedData.fatGrams) || 50),
      bmr: Math.round(Number(parsedData.bmr) || 1600),
      tdee: Math.round(Number(parsedData.tdee) || 2100),
      projectedWeeks: Number(parsedData.projectedWeeks) || 8,
      projectedEndDateLabel: String(parsedData.projectedEndDateLabel || '2 Months'),
      summaryExplanation: String(parsedData.summaryExplanation || 'Personalized conservative macro target optimized for realistic fat loss.'),
      dietaryTips: Array.isArray(parsedData.dietaryTips) ? parsedData.dietaryTips : [],
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Gemini Plan Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI macro plan.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
