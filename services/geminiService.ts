import { GoogleGenAI } from "@google/genai";

export const generateCalendarImage = async (prompt: string, aspectRatio: string = '16:9', imageSize: string = '1K'): Promise<string | null> => {
  try {
    // Instantiate here to ensure we pick up the latest key if it changed
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any,
                imageSize: imageSize as any
            }
        }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    return null;

  } catch (error: any) {
    console.error("Error generating image:", error);
    // Throw error to be caught by UI for redirect logic
    throw error;
  }
};

export const getCalendarQuote = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Fix: Use gemini-3-flash-preview for text tasks as per guidelines
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: "Give me a short, inspiring cyberpunk-style quote about time and the future. Max 15 words. Do not include quotes in the output string.",
        });
        return response.text || "Time flows like neon rain.";
    } catch (e) {
        console.error("Error fetching quote:", e);
        return "Time flows like neon rain.";
    }
};