/**
 * Lists all unique documents stored in Weaviate, grouped by docId.
 * Usage: npm run script:list-documents
 */
import 'dotenv/config';
import chalk from 'chalk';
import { getWeaviateClient } from '../src/services/weaviate/client.js';
import { WEAVIATE_CLASS_NAME, type RagDocumentChunkProperties } from '../src/services/weaviate/ensureSchema.js';

async function main() {
  const client = await getWeaviateClient();

  const exists = await client.collections.exists(WEAVIATE_CLASS_NAME);
  if (!exists) {
    console.log(chalk.yellow(`Collection "${WEAVIATE_CLASS_NAME}" does not exist.`));
    await client.close();
    return;
  }

  const collection = client.collections.get<RagDocumentChunkProperties>(WEAVIATE_CLASS_NAME);

  const aggregate = await collection.aggregate.overAll({ returnMetrics: collection.metrics.aggregate('chunkIndex').integer('count') });
  const total = (aggregate.properties as any)?.chunkIndex?.count ?? '?';
  console.log(`${chalk.bold('Total chunks:')} ${chalk.yellow(total)}\n`);

  // Fetch all chunks and group by docId client-side (Weaviate CE lacks GROUP BY)
  const docs = new Map<string, { filename: string; chunkCount: number }>();

  for await (const obj of collection.iterator({ returnProperties: ['docId', 'filename', 'chunkIndex'] })) {
    const { docId, filename } = obj.properties;
    const existing = docs.get(docId);
    if (existing) {
      existing.chunkCount++;
    } else {
      docs.set(docId, { filename, chunkCount: 1 });
    }
  }

  if (docs.size === 0) {
    console.log(chalk.yellow('No documents found.'));
    await client.close();
    return;
  }

  console.log(`${chalk.bold('Documents')} ${chalk.dim(`(${docs.size})`)}\n`);
  console.log(
    chalk.dim('docId'.padEnd(38)),
    chalk.dim('filename'.padEnd(40)),
    chalk.dim('chunks'),
  );
  console.log(chalk.dim('─'.repeat(90)));

  for (const [docId, { filename, chunkCount }] of [...docs.entries()].sort((a, b) => a[1].filename.localeCompare(b[1].filename))) {
    console.log(
      chalk.dim(docId.padEnd(38)),
      chalk.green(filename.padEnd(40)),
      chalk.yellow(chunkCount),
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});
