import { File } from 'expo-file-system';
import { GoogleGenAI } from '@google/genai';
import type { OcrResult } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const PROMPT = `Bu altın külçe fotoğrafından şu bilgileri JSON olarak çıkar:
- serial_number: seri numarası (genellikle alt kısımda, alfanumerik)
- weight_g: gram cinsinden ağırlık (sadece sayı, örn: 50)
- brand: üretici/marka adı
Sadece JSON döndür, başka hiçbir şey yazma.`;

export async function analyzeGoldBar(imageUri: string): Promise<OcrResult | null> {
  try {
    const base64Image = await new File(imageUri).base64();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            { text: PROMPT },
          ],
        },
      ],
    });

    const text = response.text;
    if (!text) {
      console.error('Gemini API: no text in response', JSON.stringify(response));
      return null;
    }

    const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      serial_number: String(parsed.serial_number ?? ''),
      weight_g: Number(parsed.weight_g) || 0,
      brand: String(parsed.brand ?? ''),
    };
  } catch (err) {
    console.error('Gemini API exception', err);
    return null;
  }
}
