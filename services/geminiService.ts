
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Operation, Chat } from "@google/genai";
import { FileData, AspectRatio } from "../types";

const getGenAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// FIX: Replace generateText with createChat for stateful conversations.
// Chat
export const createChat = (model: string, useThinking: boolean): Chat => {
    const ai = getGenAIClient();
    return ai.chats.create({
        model: model,
        config: useThinking ? { thinkingConfig: { thinkingBudget: 32768 } } : {},
    });
};

// Image Generation (Imagen)
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

// Image Analysis
export const analyzeImage = (prompt: string, image: FileData): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    return ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: image.base64, mimeType: image.mimeType } }
            ]
        }
    });
};

// Image Editing
export const editImage = (prompt: string, image: FileData): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    return ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
                { text: prompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
};

// Image Merging
export const mergeImages = (prompt: string, image1: FileData, image2: FileData): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    return ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
                { inlineData: { data: image2.base64, mimeType: image2.mimeType } }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
};

// Video Generation (Text or Image)
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: FileData): Promise<Operation> => {
    const ai = getGenAIClient(); // Re-create client to get latest key
    const payload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    };
    if (image) {
        payload.image = { imageBytes: image.base64, mimeType: image.mimeType };
    }
    return ai.models.generateVideos(payload);
};

export const checkVideoOperation = (operation: Operation): Promise<Operation> => {
    const ai = getGenAIClient();
    return ai.operations.getVideosOperation({ operation: operation });
};


// Video Analysis
export const analyzeVideo = (prompt: string, frames: string[]): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    const parts = [
        { text: prompt },
        ...frames.map(frame => ({
            inlineData: {
                data: frame,
                mimeType: 'image/jpeg'
            }
        }))
    ];

    return ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: parts }
    });
};

// Text-to-Speech
export const generateSpeech = (text: string): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    return ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
};
