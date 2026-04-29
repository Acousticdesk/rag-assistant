import OpenAI from 'openai';
import { logger } from '../../logger.js';

const BATCH_SIZE = 100;
const MODEL = 'text-embedding-3-small';

export class OpenAIEmbeddings {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async embed(text: string): Promise<number[]> {
    logger.debug(`embed: single text, ${text.length} chars`);
    const [embedding] = await this.batchEmbed([text]);
    return embedding;
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      logger.warn('batchEmbed called with empty texts array — returning no vectors');
      return [];
    }
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }
    logger.debug(`batchEmbed: ${texts.length} text(s) → ${batches.length} API batch(es)`);

    const results = await Promise.all(batches.map((batch) => this.embedBatch(batch)));
    return results.flat();
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    logger.debug(`embedBatch: calling API with ${texts.length} text(s), model=${MODEL}`);
    const response = await this.client.embeddings.create({
      model: MODEL,
      input: texts,
    });
    const dim = response.data[0]?.embedding.length ?? 0;
    logger.debug(`embedBatch: received ${response.data.length} vector(s), dim=${dim}`);
    // Sort by index to guarantee order matches input
    return response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }
}
