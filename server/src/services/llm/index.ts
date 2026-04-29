import { LLMProvider } from './LLMProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { logger } from '../../logger.js';

export function createLLMProvider(provider: string): LLMProvider {
  logger.debug(`createLLMProvider: resolving provider="${provider}"`);
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Provider "${provider}" is not supported yet`);
  }
}
