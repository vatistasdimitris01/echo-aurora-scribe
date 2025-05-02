
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AssistantInput from './AssistantInput';
import AudioVisualizer from './AudioVisualizer';
import LanguageSelector from './LanguageSelector';
import { AssistantState, ChatMessage } from '@/types';
import { 
  fetchGroqResponse, 
  fetchCartesiaTTS, 
  getUserLocation, 
  getWeatherData,
  enhanceUserPrompt,
  getCurrentTime
} from '@/utils/assistantUtils';
import { 
  detectLanguage, 
  getSystemPromptForLanguage, 
  supportedLanguages 
} from '@/utils/languageUtils';

// Predefined API keys
const GROQ_API_KEY = "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";
const CARTESIA_API_KEY = "sk_car_9i6vHEiEQxzkRVoku4gsMA";

const Assistant: React.FC = () => {
  const [state, setState] = useState<AssistantState>('idle');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Setup speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setTranscription(transcript);
        
        // Check if this is a final result
        if (event.results[event.results.length - 1].isFinal) {
          handleUserInput(transcript);
          stopListening();
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        stopListening();
        toast.error('Speech recognition error: ' + event.error);
      };
    } else {
      toast.error('Speech recognition is not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLanguage]);
  
  const startListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
      setIsListening(true);
      setState('listening');
      setTranscription('');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start listening');
    }
  };
  
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setState('idle');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const playAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    try {
      // Stop any currently playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      // Create a new audio source
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBufferRef.current;
      audioSourceRef.current.connect(audioContextRef.current.destination);
      
      // Set state to speaking
      setState('speaking');
      
      // Play the audio
      audioSourceRef.current.start();
      
      // When audio completes, set state back to idle
      audioSourceRef.current.onended = () => {
        setState('idle');
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setState('idle');
      toast.error('Error playing audio response');
    }
  };
  
  const handleUserInput = async (input: string) => {
    try {
      // Detect language if different from selected
      const detectedLanguage = detectLanguage(input);
      const langToUse = detectedLanguage !== selectedLanguage ? detectedLanguage : selectedLanguage;
      
      // Update state
      setState('processing');
      setTranscription(input);
      
      // Process special commands or keywords
      if (input.toLowerCase().includes('weather') || 
          input.toLowerCase().includes('forecast') ||
          input.toLowerCase().includes('temperatura') ||
          input.toLowerCase().includes('météo')) {
        
        // Get location for weather
        const location = await getUserLocation();
        const weatherInfo = await getWeatherData(location);
        
        // Prepare enhanced prompt for the assistant
        const weatherPrompt = `${input} ${weatherInfo}`;
        const enhancedMessages = enhanceUserPrompt(weatherPrompt);
        
        // Add language-specific system message
        enhancedMessages.unshift({
          role: 'system',
          content: getSystemPromptForLanguage(langToUse)
        });
        
        // Get response from Groq
        const assistantResponse = await fetchGroqResponse(enhancedMessages, GROQ_API_KEY);
        
        // Update state and UI
        setResponse(assistantResponse);
        setMessages([...enhancedMessages, { role: 'assistant', content: assistantResponse }]);
        
        // Get voice for detected language
        const voiceId = supportedLanguages.find(lang => lang.code === langToUse)?.voiceId;
        
        // Convert to speech and play
        const audioData = await fetchCartesiaTTS(assistantResponse, CARTESIA_API_KEY, voiceId);
        await playAudio(audioData);
      } 
      // Handle time requests
      else if (input.toLowerCase().includes('time') || 
               input.toLowerCase().includes('hora') || 
               input.toLowerCase().includes('heure')) {
        const currentTime = getCurrentTime();
        const timePrompt = `${input} The current time is ${currentTime}.`;
        const enhancedMessages = enhanceUserPrompt(timePrompt);
        
        enhancedMessages.unshift({
          role: 'system',
          content: getSystemPromptForLanguage(langToUse)
        });
        
        const assistantResponse = await fetchGroqResponse(enhancedMessages, GROQ_API_KEY);
        setResponse(assistantResponse);
        setMessages([...enhancedMessages, { role: 'assistant', content: assistantResponse }]);
        
        const voiceId = supportedLanguages.find(lang => lang.code === langToUse)?.voiceId;
        const audioData = await fetchCartesiaTTS(assistantResponse, CARTESIA_API_KEY, voiceId);
        await playAudio(audioData);
      }
      // Handle location requests
      else if (input.toLowerCase().includes('location') || 
               input.toLowerCase().includes('where am i') || 
               input.toLowerCase().includes('dónde estoy') ||
               input.toLowerCase().includes('où suis-je')) {
        const location = await getUserLocation();
        const locationPrompt = `${input} You are currently at: ${location}.`;
        const enhancedMessages = enhanceUserPrompt(locationPrompt);
        
        enhancedMessages.unshift({
          role: 'system',
          content: getSystemPromptForLanguage(langToUse)
        });
        
        const assistantResponse = await fetchGroqResponse(enhancedMessages, GROQ_API_KEY);
        setResponse(assistantResponse);
        setMessages([...enhancedMessages, { role: 'assistant', content: assistantResponse }]);
        
        const voiceId = supportedLanguages.find(lang => lang.code === langToUse)?.voiceId;
        const audioData = await fetchCartesiaTTS(assistantResponse, CARTESIA_API_KEY, voiceId);
        await playAudio(audioData);
      }
      // Default response flow for general questions
      else {
        const enhancedMessages = enhanceUserPrompt(input);
        
        enhancedMessages.unshift({
          role: 'system',
          content: getSystemPromptForLanguage(langToUse)
        });
        
        const assistantResponse = await fetchGroqResponse(enhancedMessages, GROQ_API_KEY);
        setResponse(assistantResponse);
        setMessages([...enhancedMessages, { role: 'assistant', content: assistantResponse }]);
        
        const voiceId = supportedLanguages.find(lang => lang.code === langToUse)?.voiceId;
        const audioData = await fetchCartesiaTTS(assistantResponse, CARTESIA_API_KEY, voiceId);
        await playAudio(audioData);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setState('idle');
      toast.error('Error processing your request');
    }
  };
  
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
        <div className="absolute top-4 right-4">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <AudioVisualizer state={state} />
          </div>
          
          <div className="mt-4 text-center">
            {state === 'idle' && !response && (
              <p className="text-lg opacity-60">I'm here to help you. Ask me anything.</p>
            )}
            {state === 'listening' && (
              <p className="text-lg font-medium animate-fade-in">
                {transcription || "Listening..."}
              </p>
            )}
            {state === 'processing' && (
              <p className="text-lg font-medium animate-fade-in">Processing...</p>
            )}
            {(state === 'speaking' || (state === 'idle' && response)) && (
              <p className="text-lg font-medium animate-fade-in">{response}</p>
            )}
          </div>
        </div>
        
        <div className="w-full max-w-lg">
          <AssistantInput
            onInputSubmit={handleUserInput}
            state={state}
            isListening={isListening}
            toggleListening={toggleListening}
            placeholder={isListening ? "Listening..." : "Ask me anything..."}
          />
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>A fast, intelligent voice assistant powered by</p>
          <p className="font-medium">Groq, Cartesia</p>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
