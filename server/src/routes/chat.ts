import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLLMProvider } from '../services/llm/index.js';
import { OpenAIEmbeddings } from '../services/embeddings/OpenAIEmbeddings.js';
import { buildRagPrompt } from '../prompts/ragSystemPrompt.js';
import { getDb } from '../services/db/Database.js';
import { getWeaviateClient } from '../services/weaviate/client.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../logger.js';
import {
  WEAVIATE_CLASS_NAME,
  type RagDocumentChunkProperties,
} from '../services/weaviate/ensureSchema.js';

export const chatRouter = Router();

const TOP_K = 5;

chatRouter.use(requireAuth);

chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, provider, apiKey, chatId } = req.body;

    if (!apiKey) {
      logger.warn('chat: request missing apiKey — returning 400');
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    if (!messages || !Array.isArray(messages)) {
      logger.warn('chat: request missing or invalid messages field — returning 400');
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    if (messages.length === 0) {
      logger.warn('chat: messages array is empty — no user turn to process');
    }

    const activeChatId: string =
      chatId ??
      (() => {
        const id = uuidv4();
        getDb().prepare('INSERT INTO chat_sessions (id) VALUES (?)').run(id);
        logger.info(`New chat session created: ${id}`);
        return id;
      })();

    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === 'user');
    const queryText: string = lastUserMessage?.content ?? '';

    if (!lastUserMessage) {
      logger.warn(
        `chat ${activeChatId}: no user message found in messages array — RAG and DB write will be skipped`,
      );
    }

    let systemPrompt: string | null = null;
    const sourceDocIds: string[] = [];

    if (queryText) {
      logger.info(
        `RAG retrieval for chat ${activeChatId}: querying with ${queryText.length} chars`,
      );
      const embeddings = new OpenAIEmbeddings(apiKey);
      const queryVector = await embeddings.embed(queryText);
      logger.debug(`RAG: query vector dim=${queryVector.length}`);
      const weaviateClient = await getWeaviateClient();
      const collection = weaviateClient.collections.use<
        typeof WEAVIATE_CLASS_NAME,
        RagDocumentChunkProperties
      >(WEAVIATE_CLASS_NAME);

      const queryResult = await collection.query.nearVector(queryVector, {
        limit: TOP_K,
        returnProperties: ['text', 'docId'],
        returnMetadata: ['distance'],
      });

      const results = queryResult.objects.map((item) => ({
        text: item.properties.text ?? '',
        docId: item.properties.docId ?? '',
        distance: item.metadata?.distance,
      }));
      logger.debug(
        `RAG: distances=[${results.map((r) => r.distance?.toFixed(4) ?? 'N/A').join(', ')}]`,
      );

      if (results.length > 0) {
        systemPrompt = buildRagPrompt(results.map((r) => r.text));
        const uniqueDocIds = [...new Set(results.map((r) => r.docId))];
        sourceDocIds.push(...uniqueDocIds);
        logger.info(
          `RAG: found ${results.length} chunks from ${uniqueDocIds.length} doc(s) for chat ${activeChatId}`,
        );
      } else {
        logger.info(`RAG: no relevant context found for chat ${activeChatId}`);
      }
    }

    if (lastUserMessage) {
      getDb()
        .prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), activeChatId, 'user', lastUserMessage.content);
    }

    const llmMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const resolvedProvider = provider || 'openai';
    if (!provider) {
      logger.warn(`chat ${activeChatId}: no provider in request body, defaulting to openai`);
    }
    logger.info(
      `LLM request: provider=${resolvedProvider}, messages=${llmMessages.length}, chat=${activeChatId}`,
    );
    const roleSummary = llmMessages.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {});
    logger.debug(`LLM message breakdown: ${JSON.stringify(roleSummary)}`);
    const llm = createLLMProvider(resolvedProvider);
    const reply = await llm.chat(llmMessages, apiKey);
    logger.info(`LLM response received: ${reply.length} chars for chat ${activeChatId}`);

    const assistantMsgId = uuidv4();
    getDb()
      .prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)')
      .run(assistantMsgId, activeChatId, 'assistant', reply);

    if (sourceDocIds.length > 0) {
      const stmt = getDb().prepare(
        'INSERT OR IGNORE INTO chat_message_sources (message_id, document_id) VALUES (?, ?)',
      );
      for (const docId of sourceDocIds) {
        stmt.run(assistantMsgId, docId);
      }
    }

    res.json({ reply, chatId: activeChatId });
  } catch (err) {
    next(err);
  }
});
