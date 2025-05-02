
import { LanguageOption } from '@/types';

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'es', name: 'Español', voiceId: '29vD33N1CtxCmqQRPOHJ' },
  { code: 'fr', name: 'Français', voiceId: 'BG2ZJXQdyHirGgPXGZPR' },
  { code: 'de', name: 'Deutsch', voiceId: 'z9fAnlkpzviPz146aGWa' },
  { code: 'zh', name: '中文', voiceId: 'Gp8iLp93qVg5pwZkHNTF' },
  { code: 'ar', name: 'العربية', voiceId: 'LcNEW60QqPvKj17x8xOn' },
];

export const detectLanguage = (text: string): string => {
  // Basic language detection based on character sets
  // This is a simplified version - in production you'd use a proper language detection library
  
  // Chinese characters
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  
  // Arabic characters
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  // Spanish detection (common Spanish words)
  const spanishWords = ['hola', 'gracias', 'por favor', 'cómo', 'está', 'bueno', 'día'];
  if (spanishWords.some(word => text.toLowerCase().includes(word))) return 'es';
  
  // French detection (common French words)
  const frenchWords = ['bonjour', 'merci', 'comment', 'être', 'jour', 's\'il vous plaît'];
  if (frenchWords.some(word => text.toLowerCase().includes(word))) return 'fr';
  
  // German detection (common German words)
  const germanWords = ['hallo', 'danke', 'bitte', 'wie', 'gut', 'tag'];
  if (germanWords.some(word => text.toLowerCase().includes(word))) return 'de';
  
  // Default to English
  return 'en';
};

export const getSystemPromptForLanguage = (langCode: string): string => {
  switch (langCode) {
    case 'es':
      return "Eres un asistente de voz amigable y servicial. Responde de manera concisa y útil en español.";
    case 'fr':
      return "Tu es un assistant vocal amical et serviable. Réponds de manière concise et utile en français.";
    case 'de':
      return "Du bist ein freundlicher und hilfsbereiter Sprachassistent. Antworte kurz und hilfreich auf Deutsch.";
    case 'zh':
      return "你是一个友好且乐于助人的语音助手。用中文简明扼要地回答问题。";
    case 'ar':
      return "أنت مساعد صوتي ودود ومفيد. قدم إجابات موجزة ومفيدة باللغة العربية.";
    default:
      return "You are a friendly and helpful voice assistant. Answer concisely and helpfully in English.";
  }
};
