import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DocumentParser } from '../services/ingestion/DocumentParser';
import { TextSplitter } from '../services/ingestion/TextSplitter';
import { OpenAIEmbeddings } from '../services/embeddings/OpenAIEmbeddings';
import { getDb } from '../services/db/Database';
import { getWeaviateClient } from '../services/weaviate/client';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../logger.js';
import {
  WEAVIATE_CLASS_NAME,
  type RagDocumentChunkProperties,
} from '../services/weaviate/ensureSchema';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadRouter = Router();

const parser = new DocumentParser();
const splitter = new TextSplitter();

uploadRouter.use(requireAuth);

uploadRouter.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        logger.warn('upload: request missing file — returning 400');
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const apiKey = req.body.apiKey as string | undefined;
      if (!apiKey) {
        logger.warn(`upload: request for ${req.file.originalname} missing apiKey — returning 400`);
        res.status(400).json({ error: 'apiKey is required' });
        return;
      }

      const { buffer, originalname, mimetype } = req.file;
      logger.info(`Upload received: ${originalname} (${buffer.byteLength} bytes, ${mimetype})`);

      const sha256 = createHash('sha256').update(buffer).digest('hex');
      logger.debug(`Upload SHA256: ${originalname} → ${sha256}`);
      const existing = getDb().prepare('SELECT * FROM documents WHERE sha256 = ?').get(sha256) as
        | {
            id: string;
            filename: string;
            chunk_count: number;
            token_count: number;
          }
        | undefined;

      if (existing) {
        logger.info(`Duplicate file detected: ${originalname} (docId=${existing.id})`);
        res.json({
          docId: existing.id,
          filename: existing.filename,
          duplicate: true,
          stats: {
            pages: 0,
            chunks: existing.chunk_count,
            tokensEmbedded: existing.token_count,
          },
        });
        return;
      }

      const { text, pages } = await parser.parse(buffer, mimetype, originalname);
      logger.info(`Parsed ${originalname}: ${pages} page(s), ${text.length} chars`);

      const chunks = splitter.split(text);
      const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
      logger.info(`Split ${originalname}: ${chunks.length} chunks, ${totalTokens} tokens`);
      if (chunks.length > 0) {
        const tokenCounts = chunks.map((c) => c.tokenCount);
        const minTok = Math.min(...tokenCounts);
        const maxTok = Math.max(...tokenCounts);
        const avgTok = Math.round(totalTokens / chunks.length);
        logger.debug(`Chunk token distribution: min=${minTok}, avg=${avgTok}, max=${maxTok}`);
      }

      const docId = uuidv4();
      getDb()
        .prepare(
          'INSERT INTO documents (id, filename, sha256, chunk_count, token_count) VALUES (?, ?, ?, ?, ?)',
        )
        .run(docId, originalname, sha256, chunks.length, totalTokens);

      try {
        logger.info(`Embedding ${chunks.length} chunks for ${originalname}`);
        const embeddings = new OpenAIEmbeddings(apiKey);
        const vectors = await embeddings.batchEmbed(chunks.map((c) => c.text));

        const weaviateClient = await getWeaviateClient();
        const collection = weaviateClient.collections.use<
          typeof WEAVIATE_CLASS_NAME,
          RagDocumentChunkProperties
        >(WEAVIATE_CLASS_NAME);
        await collection.data.insertMany(
          chunks.map((chunk, i) => ({
            id: uuidv4(),
            vectors: vectors[i],
            properties: {
              text: chunk.text,
              docId,
              filename: originalname,
              chunkIndex: chunk.index,
            },
          })),
        );
        logger.info(
          `Indexed ${chunks.length} chunks into Weaviate for ${originalname} (docId=${docId})`,
        );

        getDb().prepare("UPDATE documents SET status = 'ready' WHERE id = ?").run(docId);
        logger.info(`Document ready: ${originalname} (docId=${docId})`);
      } catch (err) {
        getDb().prepare("UPDATE documents SET status = 'failed' WHERE id = ?").run(docId);
        throw err;
      }

      res.json({
        docId,
        filename: originalname,
        stats: {
          pages,
          chunks: chunks.length,
          tokensEmbedded: totalTokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
