import { encoding_for_model, Tiktoken, TiktokenModel } from 'tiktoken';
import { logger } from '../../logger.js';

export interface Chunk {
  text: string;
  tokenCount: number;
  index: number;
}

const DELIMITERS = ['\n\n', '\n', '. ', ' '];

export class TextSplitter {
  private readonly maxTokens: number;
  private readonly overlapTokens: number;
  private readonly model: TiktokenModel;

  constructor(
    maxTokens = 512,
    overlapTokens = 64,
    model: TiktokenModel = 'text-embedding-3-small',
  ) {
    this.maxTokens = maxTokens;
    this.overlapTokens = overlapTokens;
    this.model = model;
  }

  split(text: string): Chunk[] {
    logger.debug(
      `TextSplitter.split: ${text.length} chars, maxTokens=${this.maxTokens}, overlapTokens=${this.overlapTokens}`,
    );
    const enc = encoding_for_model(this.model);
    try {
      const rawParts = this.recursiveSplit(text, 0, enc);
      logger.debug(`TextSplitter.split: ${rawParts.length} raw part(s) before overlap merge`);
      const chunks = this.mergeWithOverlap(rawParts, enc);
      logger.debug(`TextSplitter.split: ${chunks.length} final chunk(s)`);
      return chunks;
    } finally {
      enc.free();
    }
  }

  private tokenCount(text: string, enc: Tiktoken): number {
    return enc.encode(text).length;
  }

  private recursiveSplit(text: string, delimiterIndex: number, enc: Tiktoken): string[] {
    if (this.tokenCount(text, enc) <= this.maxTokens) {
      return text.trim() ? [text] : [];
    }

    if (delimiterIndex >= DELIMITERS.length) {
      logger.warn(
        `TextSplitter: no delimiter worked, falling back to hard character split (length=${text.length}) — document may have unusual structure`,
      );
      // Hard character split as last resort
      const mid = Math.floor(text.length / 2);
      return [
        ...this.recursiveSplit(text.slice(0, mid), delimiterIndex, enc),
        ...this.recursiveSplit(text.slice(mid), delimiterIndex, enc),
      ];
    }

    const delimiter = DELIMITERS[delimiterIndex];
    const parts = text.split(delimiter);

    if (parts.length === 1) {
      return this.recursiveSplit(text, delimiterIndex + 1, enc);
    }

    const result: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + delimiter + part : part;

      if (this.tokenCount(candidate, enc) <= this.maxTokens) {
        current = candidate;
      } else {
        if (current.trim()) result.push(current);

        if (this.tokenCount(part, enc) > this.maxTokens) {
          result.push(...this.recursiveSplit(part, delimiterIndex + 1, enc));
          current = '';
        } else {
          current = part;
        }
      }
    }
    if (current.trim()) result.push(current);

    return result;
  }

  private mergeWithOverlap(parts: string[], enc: Tiktoken): Chunk[] {
    const chunks: Chunk[] = [];

    for (let i = 0; i < parts.length; i++) {
      let text = parts[i];

      if (i > 0 && this.overlapTokens > 0) {
        const prev = parts[i - 1];
        const prevTokens = enc.encode(prev);
        const overlapStart = Math.max(0, prevTokens.length - this.overlapTokens);
        // Approximate character position proportionally
        const charPos = Math.floor((overlapStart / prevTokens.length) * prev.length);
        const overlapText = prev.slice(charPos);
        text = overlapText + ' ' + text;
      }

      const count = this.tokenCount(text, enc);
      chunks.push({ text: text.trim(), tokenCount: count, index: i });
    }

    return chunks.filter((c) => c.text.length > 0);
  }
}
