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

    // Handle Natural Language Text Description
    if (contentType.includes('application/json')) {
      const body = await req.json();

      if (body.textDescription) {
        const textPrompt = `You are an expert nutritional analyst and registered dietitian AI.
Analyze the following text description of a meal: "${body.textDescription}"
Estimate realistic serving size in grams, total calories (kcal), and macronutrients in grams (protein, carbohydrates, fats).

You MUST respond ONLY with a raw, valid JSON object matching this exact schema:
{
  "mealName": "Specific clean title of the food item",
  "estimatedWeightGrams": 250,
  "calories": 450,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 15,
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
          estimatedWeightGrams: Math.round(Number(parsed.estimatedWeightGrams) || 200),
          calories: Math.round(Number(parsed.calories) || 350),
          proteinGrams: Math.round(Number(parsed.proteinGrams) || 20),
          carbsGrams: Math.round(Number(parsed.carbsGrams) || 30),
          fatGrams: Math.round(Number(parsed.fatGrams) || 12),
          confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.9)),
        });
      }

      // Base64 image in JSON
      if (body.image) {
        let mimeType = 'image/jpeg';
        let base64Image = body.image;
        const match = body.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Image = match[2];
        }

        const visionPrompt = `You are an expert nutritional analyst AI.
Analyze the provided food/dish image with high precision.
Estimate realistic portion size in grams, total calories (kcal), and macronutrients in grams (protein, carbohydrates, fats).
Respond ONLY with raw JSON schema:
{
  "mealName": "Specific name of dish",
  "estimatedWeightGrams": 250,
  "calories": 450,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 15,
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
          estimatedWeightGrams: Math.round(Number(parsedData.estimatedWeightGrams) || 200),
          calories: Math.round(Number(parsedData.calories) || 350),
          proteinGrams: Math.round(Number(parsedData.proteinGrams) || 20),
          carbsGrams: Math.round(Number(parsedData.carbsGrams) || 30),
          fatGrams: Math.round(Number(parsedData.fatGrams) || 12),
          confidenceScore: Math.min(1, Math.max(0, Number(parsedData.confidenceScore) || 0.85)),
        });
      }
    }

    // Handle Multipart Form Data (Image file)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      const textDesc = formData.get('textDescription') as string | null;

      if (textDesc) {
        const textPrompt = `Analyze meal text: "${textDesc}". Return JSON matching schema:
{
  "mealName": "Specific clean title",
  "estimatedWeightGrams": 250,
  "calories": 450,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 15,
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
          estimatedWeightGrams: Math.round(Number(parsed.estimatedWeightGrams) || 200),
          calories: Math.round(Number(parsed.calories) || 350),
          proteinGrams: Math.round(Number(parsed.proteinGrams) || 20),
          carbsGrams: Math.round(Number(parsed.carbsGrams) || 30),
          fatGrams: Math.round(Number(parsed.fatGrams) || 12),
          confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.9)),
        });
      }

      if (file) {
        const mimeType = file.type || 'image/jpeg';
        const arrayBuffer = await file.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        const visionPrompt = `Analyze food image. Respond ONLY with raw JSON schema:
{
  "mealName": "Specific name",
  "estimatedWeightGrams": 250,
  "calories": 450,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 15,
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
          estimatedWeightGrams: Math.round(Number(parsedData.estimatedWeightGrams) || 200),
          calories: Math.round(Number(parsedData.calories) || 350),
          proteinGrams: Math.round(Number(parsedData.proteinGrams) || 20),
          carbsGrams: Math.round(Number(parsedData.carbsGrams) || 30),
          fatGrams: Math.round(Number(parsedData.fatGrams) || 12),
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
