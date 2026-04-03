
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeThought = async (text: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this fleeting thought from an ADHD user. Summarize it briefly and categorize it. 
    Thought: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          category: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
        },
        required: ['summary', 'category', 'priority']
      }
    }
  });

  return JSON.parse(response.text);
};

export const detectStressFromFrames = async (base64Images: string[]) => {
  try {
    const parts = base64Images.map(data => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: data
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...parts,
        { text: `You are an AR behavioral assistant for ADHD patients. 
        Analyze this sequence of 3 frames. 
        1. Identify stress/overload markers.
        2. Detect "interruption habits" (sudden jerky movements, hand-to-mouth, looking away frequently).
        3. Recommend a specific Presence Exercise (Breathing, Grounding, or Focus Anchor) to help the user re-center.
        
        Provide a detailed assessment and the exercise.` }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stressScore: { type: Type.NUMBER },
            isHighStress: { type: Type.BOOLEAN },
            habitDetected: { type: Type.STRING },
            indicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ['type', 'severity', 'description']
              }
            },
            presenceExercise: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                instructions: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                visualType: { type: Type.STRING, enum: ['breathing', 'grounding', 'focus'] }
              },
              required: ['title', 'instructions', 'duration', 'visualType']
            }
          },
          required: ['stressScore', 'isHighStress', 'indicators', 'presenceExercise']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Advanced stress detection failed", e);
    return null;
  }
};
