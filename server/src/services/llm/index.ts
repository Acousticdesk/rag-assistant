import { LLMProvider } from './LLMProvider';
import { OpenAIProvider } from './OpenAIProvider';

export function createLLMProvider(provider: string): LLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Provider "${provider}" is not supported yet`);
  }
}
