import { getWeaviateClient } from './client.js';
import { logger } from '../../logger.js';

export const WEAVIATE_CLASS_NAME = 'RagDocumentChunk';

export type RagDocumentChunkProperties = {
  text: string;
  docId: string;
  filename: string;
  chunkIndex: number;
};

let weaviateSchemaReady = false;

class WeaviateSchemaError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WeaviateSchemaError';
  }
}

export async function ensureWeaviateSchema(): Promise<void> {
  if (weaviateSchemaReady) {
    logger.debug('ensureWeaviateSchema: schema already verified, skipping');
    return;
  }

  try {
    const weaviateClient = await getWeaviateClient();
    const classExists = await weaviateClient.collections.exists(WEAVIATE_CLASS_NAME);
    logger.debug(`ensureWeaviateSchema: class '${WEAVIATE_CLASS_NAME}' exists=${classExists}`);

    if (!classExists) {
      logger.info(`Creating Weaviate class: ${WEAVIATE_CLASS_NAME}`);
      await weaviateClient.collections.createFromSchema({
        class: WEAVIATE_CLASS_NAME,
        vectorizer: 'none',
        vectorIndexConfig: {
          distance: 'cosine',
        },
        properties: [
          { name: 'text', dataType: ['text'] },
          { name: 'docId', dataType: ['text'] },
          { name: 'filename', dataType: ['text'] },
          { name: 'chunkIndex', dataType: ['int'] },
        ],
      });
      logger.info(`Weaviate class created: ${WEAVIATE_CLASS_NAME}`);
    } else {
      logger.info(`Weaviate class already exists: ${WEAVIATE_CLASS_NAME}`);
    }

    weaviateSchemaReady = true;
  } catch (err) {
    weaviateSchemaReady = false;
    throw new WeaviateSchemaError(`Failed to ensure Weaviate schema. Details: ${err}.`, {
      cause: err,
    });
  }
}
