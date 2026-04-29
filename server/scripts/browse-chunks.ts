/**
 * Browses RagDocumentChunk objects with optional filtering by docId or filename.
 *
 * Usage: npm run script:browse-chunks [-- --doc <docId|filename>] [--limit <n>] [--offset <n>]
 *
 * Examples:
 *   npm run script:browse-chunks
 *   npm run script:browse-chunks -- --doc my-notes.pdf
 *   npm run script:browse-chunks -- --doc abc-123 --limit 5
 *   npm run script:browse-chunks -- --limit 20 --offset 40
 */
import 'dotenv/config';
import chalk from 'chalk';
import { getWeaviateClient } from '../src/services/weaviate/client.js';
import { WEAVIATE_CLASS_NAME, type RagDocumentChunkProperties } from '../src/services/weaviate/ensureSchema.js';
import { Filters } from 'weaviate-client';

function parseArgs(): { doc?: string; limit: number; offset: number } {
  const args = process.argv.slice(2);
  let doc: string | undefined;
  let limit = 10;
  let offset = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--doc' && args[i + 1]) doc = args[++i];
    else if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[++i], 10);
    else if (args[i] === '--offset' && args[i + 1]) offset = parseInt(args[++i], 10);
  }

  return { doc, limit, offset };
}

async function main() {
  const { doc, limit, offset } = parseArgs();

  const client = await getWeaviateClient();

  const exists = await client.collections.exists(WEAVIATE_CLASS_NAME);
  if (!exists) {
    console.log(chalk.yellow(`Collection "${WEAVIATE_CLASS_NAME}" does not exist.`));
    await client.close();
    return;
  }

  const collection = client.collections.get<RagDocumentChunkProperties>(WEAVIATE_CLASS_NAME);

  const filters = doc
    ? Filters.or(
        collection.filter.byProperty('docId').equal(doc),
        collection.filter.byProperty('filename').equal(doc),
      )
    : undefined;

  const result = await collection.query.fetchObjects({
    filters,
    limit,
    offset,
    returnProperties: ['docId', 'filename', 'chunkIndex', 'text'],
  });

  if (result.objects.length === 0) {
    console.log(chalk.yellow('No chunks found' + (doc ? ` for "${doc}"` : '') + '.'));
    await client.close();
    return;
  }

  const sorted = [...result.objects].sort((a, b) => a.properties.chunkIndex - b.properties.chunkIndex);
  const docLabel = doc ? chalk.dim(` (filter: "${doc}")`) : '';
  console.log(`${chalk.bold('Showing')} ${chalk.yellow(sorted.length)} ${chalk.bold('chunk(s)')} — ${chalk.dim(`offset ${offset}`)}${docLabel}\n`);

  for (const obj of sorted) {
    const { docId, filename, chunkIndex, text } = obj.properties;
    const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;
    console.log(chalk.blue.bold(`── chunk ${chunkIndex} `) + chalk.dim('─'.repeat(50)));
    console.log(`   ${chalk.dim('id:')}       ${chalk.dim(obj.uuid)}`);
    console.log(`   ${chalk.dim('docId:')}    ${chalk.dim(docId)}`);
    console.log(`   ${chalk.dim('filename:')} ${chalk.green(filename)}`);
    console.log(`   ${chalk.dim('text:')}     ${preview}`);
    console.log();
  }

  await client.close();
}

main().catch((err) => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});
