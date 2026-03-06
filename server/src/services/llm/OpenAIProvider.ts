import OpenAI from 'openai';
import { LLMProvider, Message } from './LLMProvider';

export class OpenAIProvider implements LLMProvider {
  async chat(messages: Message[], apiKey: string): Promise<string> {
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    return completion.choices[0]?.message?.content ?? '';
  }
}
