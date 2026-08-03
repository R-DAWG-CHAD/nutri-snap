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

    const contentType = req.headers.get('content-type') || '';
    const ai = new GoogleGenAI({ apiKey });

    // Handle Natural Language Text Description in JSON
    if (contentType.includes('application/json')) {
      const body = await req.json();

      if (body.textDescription) {
        const textPrompt = `You are an expert clinical dietitian and nutritional scientist AI.
Analyze this meal description: "${body.textDescription}".
CALORIE ACCURACY INSTRUCTION: Do NOT underestimate calories. Real food includes cooking oils, butter, seasonings, and realistic restaurant/home portion sizes. Account for hidden fats and density.

Estimate realistic serving size in grams, total calories (kcal), and macronutrients in grams (protein, carbohydrates, fats).
Respond ONLY with a raw, valid JSON object matching this exact schema:
{
  "mealName": "Specific clean title of the food item",
  "estimatedWeightGrams": 250,
  "calories": 480,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 18,
  "confidenceScore": 0.95
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: textPrompt }] }],
          config: { responseMimeType: 'application/json' },
        });

        const responseText = response.text || '';
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        return NextResponse.json({
          mealName: String(parsed.mealName || body.textDescription),
          estimatedWeightGrams: Math.round(Number(parsed.estimatedWeightGrams) || 250),
          calories: Math.round(Number(parsed.calories) || 450),
          proteinGrams: Math.round(Number(parsed.proteinGrams) || 25),
          carbsGrams: Math.round(Number(parsed.carbsGrams) || 35),
          fatGrams: Math.round(Number(parsed.fatGrams) || 16),
          confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.9)),
        });
      }

      // Base64 image in JSON with optional caption
      if (body.image) {
        let mimeType = 'image/jpeg';
        let base64Image = body.image;
        const match = body.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Image = match[2];
        }

        const captionContext = body.imageCaption ? `User note about this dish: "${body.imageCaption}".` : '';

        const visionPrompt = `You are an expert nutritional analyst AI.
Analyze the provided food/dish image with high precision. ${captionContext}

CRITICAL ACCURACY INSTRUCTION:
- Do NOT underestimate calories. Real meals contain cooking oils, butter, dressings, and hidden fats.
- Calculate realistic total calories = (protein * 4) + (carbs * 4) + (fat * 9).
- Estimate realistic total weight in grams and macronutrient breakdown in grams.

Respond ONLY with raw JSON schema:
{
  "mealName": "Specific name of dish",
  "estimatedWeightGrams": 300,
  "calories": 520,
  "proteinGrams": 35,
  "carbsGrams": 45,
  "fatGrams": 20,
  "confidenceScore": 0.92
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: visionPrompt },
                { inlineData: { mimeType, data: base64Image } },
              ],
            },
          ],
          config: { responseMimeType: 'application/json' },
        });

        const responseText = response.text || '';
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedText);

        return NextResponse.json({
          mealName: String(parsedData.mealName || 'Unidentified Dish'),
          estimatedWeightGrams: Math.round(Number(parsedData.estimatedWeightGrams) || 280),
          calories: Math.round(Number(parsedData.calories) || 480),
          proteinGrams: Math.round(Number(parsedData.proteinGrams) || 28),
          carbsGrams: Math.round(Number(parsedData.carbsGrams) || 40),
          fatGrams: Math.round(Number(parsedData.fatGrams) || 18),
          confidenceScore: Math.min(1, Math.max(0, Number(parsedData.confidenceScore) || 0.85)),
        });
      }
    }

    // Handle Multipart Form Data (Image file + optional imageCaption)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      const textDesc = formData.get('textDescription') as string | null;
      const imageCaption = formData.get('imageCaption') as string | null;

      if (textDesc) {
        const textPrompt = `Analyze meal text: "${textDesc}". Do NOT underestimate calories. Account for oils/fats. Return JSON schema:
{
  "mealName": "Specific clean title",
  "estimatedWeightGrams": 250,
  "calories": 480,
  "proteinGrams": 30,
  "carbsGrams": 40,
  "fatGrams": 18,
  "confidenceScore": 0.95
}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: textPrompt }] }],
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || '{}');
        return NextResponse.json({
          mealName: String(parsed.mealName || textDesc),
          estimatedWeightGrams: Math.round(Number(parsed.estimatedWeightGrams) || 250),
          calories: Math.round(Number(parsed.calories) || 450),
          proteinGrams: Math.round(Number(parsed.proteinGrams) || 25),
          carbsGrams: Math.round(Number(parsed.carbsGrams) || 35),
          fatGrams: Math.round(Number(parsed.fatGrams) || 16),
          confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.9)),
        });
      }

      if (file) {
        const mimeType = file.type || 'image/jpeg';
        const arrayBuffer = await file.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const captionContext = imageCaption ? `User note about this dish: "${imageCaption}".` : '';

        const visionPrompt = `Analyze food image. ${captionContext}
CRITICAL: Do NOT underestimate calories. Account for oils, butter, sauces, and realistic portion weight.
Respond ONLY with raw JSON schema:
{
  "mealName": "Specific name",
  "estimatedWeightGrams": 300,
  "calories": 520,
  "proteinGrams": 32,
  "carbsGrams": 45,
  "fatGrams": 20,
  "confidenceScore": 0.92
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: visionPrompt },
                { inlineData: { mimeType, data: base64Image } },
              ],
            },
          ],
          config: { responseMimeType: 'application/json' },
        });

        const parsedData = JSON.parse(response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || '{}');
        return NextResponse.json({
          mealName: String(parsedData.mealName || 'Unidentified Dish'),
          estimatedWeightGrams: Math.round(Number(parsedData.estimatedWeightGrams) || 280),
          calories: Math.round(Number(parsedData.calories) || 480),
          proteinGrams: Math.round(Number(parsedData.proteinGrams) || 28),
          carbsGrams: Math.round(Number(parsedData.carbsGrams) || 40),
          fatGrams: Math.round(Number(parsedData.fatGrams) || 18),
          confidenceScore: Math.min(1, Math.max(0, Number(parsedData.confidenceScore) || 0.85)),
        });
      }
    }

    return NextResponse.json({ error: 'Please provide an image or text description.' }, { status: 400 });
  } catch (error: any) {
    console.error('Gemini Food Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal with Gemini AI.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
