export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMProvider {
  chat(messages: Message[], apiKey: string): Promise<string>;
}
