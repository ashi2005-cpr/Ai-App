
export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export enum AppTab {
  IMAGE = 'Image Studio',
  VIDEO = 'Video Hub',
  CHAT = 'AI Chat',
}

export enum ChatModel {
  // FIX: Use the recommended model name for Gemini Flash Lite.
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH = 'gemini-2.5-flash',
  PRO_THINKING = 'gemini-2.5-pro',
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// FIX: Define AIStudio in the global scope to resolve module augmentation conflicts.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

// Export the globally-defined type for use in other modules.
export type AIStudio = globalThis.AIStudio;
