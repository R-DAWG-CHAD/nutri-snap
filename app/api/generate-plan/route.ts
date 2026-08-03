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
      customAdditionalKcal,
      fitnessGoal = 'fat_loss',
      goalWeightKg,
      weeklyPaceKg = 0.5,
      dietPreference = 'balanced',
      liftpulseProfile,
    } = body;

    const ai = new GoogleGenAI({ apiKey });

    const PREFERRED_MODEL_PRIORITY = [
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let modelsToTry = PREFERRED_MODEL_PRIORITY;
    try {
      const activeModelNames: string[] = [];
      const modelPager = await ai.models.list();
      for await (const m of modelPager) {
        if (m.name) {
          activeModelNames.push(m.name.replace(/^models\//, ''));
        }
      }
      const permitted = PREFERRED_MODEL_PRIORITY.filter(p => activeModelNames.includes(p));
      if (permitted.length > 0) modelsToTry = [...permitted, ...PREFERRED_MODEL_PRIORITY];
    } catch (e) {
      console.warn('NutriSnap models.list() fallback:', e);
    }

    let expenditureContext = '';
    if (activityLevel === 'custom_expenditure' && typeof customAdditionalKcal === 'number') {
      expenditureContext = `\nCUSTOM EXPENDITURE OVERRIDE:
- User-specified additional daily expenditure: +${customAdditionalKcal} kcal/day above BMR.
CRITICAL: Compute TDEE directly as BMR + ${customAdditionalKcal} kcal/day.`;
    } else if (liftpulseProfile) {
      expenditureContext = `\nLIFTPULSE PLANNED ACTIVITY PROFILE OVERRIDE:
- Planned Workout Regiment: ${liftpulseProfile.workoutSummary || 'Custom Workout Regiment'}
- Target Daily Steps Goal: ${liftpulseProfile.dailySteps?.toLocaleString() || 10000} steps/day
- Calculated Additional Daily Activity Expenditure: +${liftpulseProfile.totalAdditionalExpenditure || 550} kcal/day above BMR.
CRITICAL: Compute TDEE as: BMR + ${liftpulseProfile.totalAdditionalExpenditure || 550} kcal.`;
    }

    const systemPrompt = `You are a strict, evidence-based clinical dietitian and sports nutritionist AI.
Calculate an accurate, realistic daily caloric target and macronutrient split (Protein, Carbohydrates, Fats in grams) based on the user's metrics:

User Profile:
- Age: ${age} years
- Gender: ${gender}
- Current Weight: ${weightKg} kg
- Height: ${heightCm} cm
- Activity Mode: ${activityLevel}${expenditureContext}
- Fitness Goal: ${fitnessGoal}
${fitnessGoal === 'fat_loss' && goalWeightKg ? `- Goal Weight: ${goalWeightKg} kg (Desired loss: ${Math.max(0, weightKg - goalWeightKg)} kg)` : ''}
${fitnessGoal === 'fat_loss' && weeklyPaceKg ? `- Target Pace: ${weeklyPaceKg} kg / week` : ''}
- Dietary Preference: ${dietPreference}

Calculation Rules:
1. Calculate BMR strictly using Mifflin-St Jeor:
   - Male: (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
   - Female: (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
2. Calculate TDEE:
   ${(activityLevel === 'custom_expenditure' && typeof customAdditionalKcal === 'number') ? `- TDEE = BMR + ${customAdditionalKcal} kcal/day (User custom expenditure)` : liftpulseProfile ? `- TDEE = BMR + ${liftpulseProfile.totalAdditionalExpenditure || 550} kcal/day` : `- Calculate TDEE using activity factors:
   - Sedentary: BMR * 1.15
   - Light: BMR * 1.25
   - Moderate: BMR * 1.35
   - Active: BMR * 1.45
   - Very Active: BMR * 1.55`}
3. For fat_loss:
   - Subtract approx 550 kcal/day per 0.5 kg/week target loss from TDEE.
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
  "summaryExplanation": "Personalized macro target calculated using your exact custom +${customAdditionalKcal || 550} kcal/day expenditure.",
  "dietaryTips": [
    "Tip 1 for success",
    "Tip 2 for success",
    "Tip 3 for success"
  ]
}`;

    let responseText = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          config: { responseMimeType: 'application/json' },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (e: any) {
        console.warn(`NutriSnap generate-plan model ${model} failed, attempting next fallback...`, e?.message || e);
      }
    }

    if (!responseText) throw new Error('Failed to generate response with Gemini models.');

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
      summaryExplanation: String(parsedData.summaryExplanation || `Personalized macro target calculated using +${customAdditionalKcal || 550} kcal/day additional expenditure.`),
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
