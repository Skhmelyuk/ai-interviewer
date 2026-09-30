export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface OpenRouterAPIMessage {
  role: MessageRole;
  content: string;
}

export interface OpenRouterChatResponse {
  id: string;
  choices: {
    message: {
      role: MessageRole;
      content: string;
    };
    finish_reason: string;
  }[];
}

export type AIModelTier = "free" | "budget" | "mid" | "flagship";

export interface AIModelOption {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  pricing?: string;
  tier?: AIModelTier;
}
