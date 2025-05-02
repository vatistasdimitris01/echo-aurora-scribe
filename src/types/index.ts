
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  feels_like?: number;
  humidity?: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  voiceId?: string;
}

export type AssistantState = "idle" | "listening" | "processing" | "speaking";
