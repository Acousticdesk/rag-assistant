import OpenAI from 'openai';
import { LLMProvider, Message } from './LLMProvider.js';
import { logger } from '../../logger.js';

export class OpenAIProvider implements LLMProvider {
  async chat(messages: Message[], apiKey: string): Promise<string> {
    logger.debug(`OpenAIProvider.chat: ${messages.length} message(s), model=gpt-4o-nano`);
    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: 'gpt-4o-nano',
      input: messages,
    });

    const text = response.output_text ?? '';
    if (!text) {
      logger.warn('OpenAIProvider.chat: API returned empty output_text');
    }
    logger.debug(`OpenAIProvider.chat: response ${text.length} chars`);
    return text;
  }
}
