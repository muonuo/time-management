
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
// Note: API Key must be in process.env.API_KEY
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export interface SmartTimerResponse {
  title: string;
  durationSeconds: number;
  suggestedColorIndex: number; // 0-7 corresponding to our COLORS array
}

// Existing function for smart timer creation
export const analyzeTimerRequest = async (userInput: string): Promise<SmartTimerResponse | null> => {
  if (!apiKey) {
    console.warn("API Key not found. Smart features disabled.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User request: "${userInput}". 
      Create a timer configuration based on this request.
      IMPORTANT: The 'title' MUST be in Simplified Chinese (简体中文).
      If the user asks for a stopwatch, set durationSeconds to 0.
      If the user is vague (e.g., "boil egg"), pick a standard time (e.g., 600 seconds).
      suggestedColorIndex should be an integer between 0 and 7 based on the 'vibe' of the task.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, descriptive title for the timer in Simplified Chinese",
            },
            durationSeconds: {
              type: Type.INTEGER,
              description: "Total duration in seconds. 0 if it should be a stopwatch.",
            },
            suggestedColorIndex: {
              type: Type.INTEGER,
              description: "A number between 0 and 7 representing a color index.",
            },
          },
          required: ["title", "durationSeconds", "suggestedColorIndex"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as SmartTimerResponse;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
};

// New function for Streaming Chat
export async function* chatWithGeminiStream(
  history: {role: string, parts: {text: string}[]}[],
  message: string
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
      yield "请先配置 API Key。";
      return;
  }

  try {
    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: '你是一个乐于助人、知识渊博的AI生活助手。请用简洁、亲切的中文回答用户的问题。对于复杂问题，请先进行深思熟虑。',
        thinkingConfig: { thinkingBudget: 1024 } // Enable thinking process
      },
      history: history
    });

    const result = await chat.sendMessageStream({ message });

    for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            yield c.text;
        }
    }
  } catch (error) {
    console.error("Chat Error:", error);
    yield "网络连接似乎有点问题，请稍后再试。";
  }
}
