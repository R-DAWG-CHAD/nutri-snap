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
      age = 25,
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

    const systemPrompt = `You are a world-class sports nutritionist, dietitian, and exercise physiologist AI.
Calculate an optimal, scientific, personalized daily caloric target and macronutrient split (Protein, Carbohydrates, Fats in grams) based on the user's metrics:

User Profile:
- Age: ${age} years
- Gender: ${gender}
- Current Weight: ${weightKg} kg
- Height: ${heightCm} cm
- Activity Level: ${activityLevel} (sedentary, light, moderate, active, very_active)
- Fitness Goal: ${fitnessGoal} (fat_loss, maintenance, muscle_gain, recomp)
${fitnessGoal === 'fat_loss' && goalWeightKg ? `- Target Goal Weight: ${goalWeightKg} kg (Desired weight loss: ${Math.max(0, weightKg - goalWeightKg)} kg)` : ''}
${fitnessGoal === 'fat_loss' && weeklyPaceKg ? `- Target Rate of Weight Loss: ${weeklyPaceKg} kg / week` : ''}
- Dietary Preference: ${dietPreference} (balanced, high_protein, low_carb, keto, vegan)

Instructions:
1. Calculate Mifflin-St Jeor BMR and activity-adjusted TDEE.
2. If goal is fat_loss:
   - Factor in the weekly pace of ${weeklyPaceKg} kg/week (approx ${Math.round(weeklyPaceKg * 7700 / 7)} kcal daily deficit).
   - Ensure calories do not drop below safe minimums (1200 kcal for females, 1500 kcal for males).
   - Calculate projected weeks needed to reach goal weight (${goalWeightKg ? Math.ceil(Math.max(0, weightKg - goalWeightKg) / (weeklyPaceKg || 0.5)) : 10} weeks).
3. If goal is muscle_gain: add a conservative surplus (+250 to +500 kcal).
4. Assign macro splits in grams according to ${dietPreference} preferences (ensure protein is sufficient for muscle preservation).
5. Return ONLY a valid JSON object matching this schema:
{
  "dailyCalories": 1950,
  "proteinGrams": 160,
  "carbsGrams": 180,
  "fatGrams": 60,
  "bmr": 1720,
  "tdee": 2350,
  "projectedWeeks": 12,
  "projectedEndDateLabel": "October 22, 2026",
  "summaryExplanation": "Specific clear 2-sentence summary of why this target was chosen",
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
      dailyCalories: Math.round(Number(parsedData.dailyCalories) || 2000),
      proteinGrams: Math.round(Number(parsedData.proteinGrams) || 150),
      carbsGrams: Math.round(Number(parsedData.carbsGrams) || 200),
      fatGrams: Math.round(Number(parsedData.fatGrams) || 65),
      bmr: Math.round(Number(parsedData.bmr) || 1700),
      tdee: Math.round(Number(parsedData.tdee) || 2200),
      projectedWeeks: Number(parsedData.projectedWeeks) || 8,
      projectedEndDateLabel: String(parsedData.projectedEndDateLabel || '2 Months'),
      summaryExplanation: String(parsedData.summaryExplanation || 'Personalized macro targets optimized for your fitness goals.'),
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
