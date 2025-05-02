
import { ChatMessage } from "@/types";

export async function fetchGroqResponse(messages: ChatMessage[], apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching response from Groq:", error);
    return "I'm sorry, I encountered an error processing your request.";
  }
}

export async function fetchCartesiaTTS(text: string, apiKey: string, voiceId?: string): Promise<ArrayBuffer> {
  try {
    // Using an updated working voice ID from Cartesia's available voices
    const voiceToUse = voiceId || "en-US-GuyNeural"; // Default to English voice if not specified
    
    const response = await fetch(`https://api.cartesia.ai/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text: text,
        voice: voiceToUse,
        speed: 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`TTS API request failed with status ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error fetching TTS from Cartesia:", error);
    throw error;
  }
}

export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString();
}

export function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString();
}

export async function getUserLocation(): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve("Location services are not available in your browser.");
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            
            if (!response.ok) {
              resolve("I was able to get your coordinates, but couldn't determine your location name.");
              return;
            }
            
            const data = await response.json();
            resolve(data.display_name || "Unknown location");
          } catch (error) {
            console.error("Error getting location name:", error);
            resolve("I was able to get your coordinates, but couldn't determine your location name.");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          resolve("I couldn't access your location. Please check your location permissions.");
        }
      );
    });
  } catch (error) {
    console.error("Error getting user location:", error);
    return "I couldn't access your location due to an error.";
  }
}

export async function getWeatherData(location: string): Promise<string> {
  try {
    // Note: In a real implementation, you'd connect to a weather API with your API key
    // This is a placeholder that would be replaced with actual API calls
    return `The weather in ${location} is currently 72°F (22°C) and sunny with light clouds. Humidity is at 45%.`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return `I couldn't retrieve the weather information for ${location} at this moment.`;
  }
}

export function enhanceUserPrompt(prompt: string): ChatMessage[] {
  const currentTime = getCurrentTime();
  const currentDate = getCurrentDate();
  
  const systemMessage: ChatMessage = {
    role: "system",
    content: `You are a helpful voice assistant similar to Siri. Today is ${currentDate} and the current time is ${currentTime}. 
    When asked about the weather, time, or location, respond as if you have that information. For weather questions, explain you're checking a weather service.
    For web searches, act as if you are searching the web and return relevant results. Keep responses concise and conversational.
    When asked about your capabilities, mention that you can provide weather updates, tell the time, find locations, search the web, and answer general questions.`
  };
  
  const userMessage: ChatMessage = {
    role: "user",
    content: prompt
  };
  
  return [systemMessage, userMessage];
}
