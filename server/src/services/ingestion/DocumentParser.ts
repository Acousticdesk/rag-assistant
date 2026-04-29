import { PDFParse } from 'pdf-parse';
import { logger } from '../../logger.js';

export interface ParseResult {
  text: string;
  pages: number;
}

export class DocumentParser {
  async parse(buffer: Buffer, mimetype: string, filename: string): Promise<ParseResult> {
    const ext = filename.split('.').pop()?.toLowerCase();
    logger.debug(
      `DocumentParser.parse: ${filename}, mimetype=${mimetype}, ext=${ext}, ${buffer.byteLength} bytes`,
    );

    if (mimetype === 'application/pdf' || ext === 'pdf') {
      logger.debug(`Routing ${filename} to PDF parser`);
      return this.parsePdf(buffer);
    }

    if (
      mimetype === 'text/plain' ||
      mimetype === 'text/markdown' ||
      ext === 'txt' ||
      ext === 'md'
    ) {
      const text = buffer.toString('utf-8');
      logger.debug(`Parsed ${filename} as plain text: ${text.length} chars`);
      return { text, pages: 1 };
    }

    throw new Error(`Unsupported file type: ${mimetype} (${filename})`);
  }

  private async parsePdf(buffer: Buffer): Promise<ParseResult> {
    logger.debug(`parsePdf: starting PDF extraction, ${buffer.byteLength} bytes`);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (!result.text.trim()) {
      throw new Error('PDF appears to contain no extractable text (may be image-based)');
    }
    const pageCount = Array.isArray(result.pages) ? result.pages.length : 0;
    logger.debug(`parsePdf: extracted ${pageCount} page(s), ${result.text.length} chars`);
    return { text: result.text, pages: pageCount };
  }
}
