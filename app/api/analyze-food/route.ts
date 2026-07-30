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

    let base64Image = '';
    let mimeType = 'image/jpeg';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No image file provided in form data' }, { status: 400 });
      }
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Image = buffer.toString('base64');
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ error: 'No base64 image provided in JSON body' }, { status: 400 });
      }
      
      // Parse base64 header if present (data:image/png;base64,...)
      const match = body.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      } else {
        base64Image = body.image;
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Send multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert nutritional analyst and registered dietitian AI.
Analyze the provided food/dish image with high precision.
Estimate realistic portion size in grams, total calories (kcal), and macronutrients in grams (protein, carbohydrates, fats).
You MUST respond ONLY with a raw, valid JSON object matching this exact schema:
{
  "mealName": "Specific name of dish or food item",
  "estimatedWeightGrams": 250,
  "calories": 450,
  "proteinGrams": 32,
  "carbsGrams": 40,
  "fatGrams": 15,
  "confidenceScore": 0.92
}

Rules:
- "confidenceScore" must be a float between 0.00 and 1.00 indicating your visual identification certainty.
- If multiple items are on the plate, calculate the total cumulative nutrition.
- Ensure calories roughly equal (protein * 4) + (carbs * 4) + (fat * 9).
- Return strictly JSON without markdown syntax wrappers, backticks, or extra commentary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    
    // Clean potential markdown blocks if present
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedText);

    // Validate expected numerical schema fields
    const result = {
      mealName: String(parsedData.mealName || 'Unidentified Dish'),
      estimatedWeightGrams: Math.round(Number(parsedData.estimatedWeightGrams) || 200),
      calories: Math.round(Number(parsedData.calories) || 350),
      proteinGrams: Math.round(Number(parsedData.proteinGrams) || 20),
      carbsGrams: Math.round(Number(parsedData.carbsGrams) || 30),
      fatGrams: Math.round(Number(parsedData.fatGrams) || 12),
      confidenceScore: Math.min(1, Math.max(0, Number(parsedData.confidenceScore) || 0.85)),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Gemini Food Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze food image with Gemini AI.', 
        details: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
