import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

async function generateWithFallback(ai: GoogleGenAI, payload: any) {
  let lastError: any;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...payload,
        model,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Chat Fallback] Model ${model} failed (${err.status || err.message}). Attempting next model...`);
      lastError = err;
    }
  }
  throw lastError;
}

function extractJson(rawText: string): any {
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Could not parse response JSON from Gemini.');
  }
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { history = [], currentMeal, userMessage, newImage } = body;

    if (!userMessage && !newImage) {
      return NextResponse.json({ error: 'Please provide a message or image.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build the conversational prompt
    const systemContext = `You are an expert clinical dietitian assisting a user in refining their meal's nutritional estimate.
CURRENT MEAL ESTIMATE:
- Meal Name: "${currentMeal?.mealName || 'Food Item'}"
- Calories: ${currentMeal?.calories || 0} kcal
- Protein: ${currentMeal?.proteinGrams || 0}g
- Carbs: ${currentMeal?.carbsGrams || 0}g
- Fat: ${currentMeal?.fatGrams || 0}g

USER'S LATEST MESSAGE / CLARIFICATION: "${userMessage || 'Uploaded follow-up photo'}"

INSTRUCTIONS:
1. Explain your reasoning clearly and conversationally (e.g. why calories were adjusted, what was deducted or added, or why calories were initially estimated that way).
2. If a new follow-up photo is provided, examine it (e.g. side angle, depth, nutrition label) to improve portion accuracy.
3. Calculate the updated realistic calories and macros.
4. Respond ONLY with a raw JSON object matching this schema:
{
  "reply": "Friendly conversational explanation of what was changed and why.",
  "updatedMacros": {
    "mealName": "Updated title if needed",
    "calories": 420,
    "proteinGrams": 40,
    "carbsGrams": 45,
    "fatGrams": 8
  }
}`;

    // Construct multi-turn contents for Gemini
    const contents: any[] = [];

    // If there is an original image and history, include it
    if (currentMeal?.originalImageUrl && currentMeal.originalImageUrl.startsWith('data:image')) {
      const match = currentMeal.originalImageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        contents.push({
          role: 'user',
          parts: [
            { text: `Initial meal photo for "${currentMeal.mealName}".` },
            { inlineData: { mimeType: match[1], data: match[2] } },
          ],
        });
        contents.push({
          role: 'model',
          parts: [{ text: `Initial estimate: ${currentMeal.calories} kcal (P:${currentMeal.proteinGrams}g, C:${currentMeal.carbsGrams}g, F:${currentMeal.fatGrams}g).` }],
        });
      }
    }

    // Add prior chat history turns
    for (const msg of history) {
      if (msg.role === 'user') {
        const parts: any[] = [{ text: msg.text }];
        if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
          const match = msg.imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        }
        contents.push({ role: 'user', parts });
      } else if (msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.text }] });
      }
    }

    // Add the new user turn
    const latestUserParts: any[] = [{ text: systemContext }];
    if (newImage && newImage.startsWith('data:image')) {
      const match = newImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        latestUserParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }
    contents.push({ role: 'user', parts: latestUserParts });

    const { response, modelUsed } = await generateWithFallback(ai, {
      contents,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = extractJson(response.text || '');

    return NextResponse.json({
      reply: String(parsed.reply || 'Updated the meal estimate based on your feedback.'),
      updatedMacros: {
        mealName: String(parsed.updatedMacros?.mealName || currentMeal?.mealName || 'Meal'),
        calories: Math.round(Number(parsed.updatedMacros?.calories) || currentMeal?.calories || 0),
        proteinGrams: Math.round(Number(parsed.updatedMacros?.proteinGrams) || currentMeal?.proteinGrams || 0),
        carbsGrams: Math.round(Number(parsed.updatedMacros?.carbsGrams) || currentMeal?.carbsGrams || 0),
        fatGrams: Math.round(Number(parsed.updatedMacros?.fatGrams) || currentMeal?.fatGrams || 0),
      },
      modelUsed,
    });
  } catch (error: any) {
    console.error('Chat Meal Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat clarification.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
