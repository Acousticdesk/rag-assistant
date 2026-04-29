/**
 * Prints the full Weaviate collection config for RagDocumentChunk.
 * Usage: npm run script:inspect-schema
 */
import 'dotenv/config';
import chalk from 'chalk';
import { getWeaviateClient } from '../src/services/weaviate/client.js';
import { WEAVIATE_CLASS_NAME } from '../src/services/weaviate/ensureSchema.js';

async function main() {
  const client = await getWeaviateClient();
  const collection = client.collections.get(WEAVIATE_CLASS_NAME);

  const exists = await client.collections.exists(WEAVIATE_CLASS_NAME);
  if (!exists) {
    console.log(chalk.yellow(`Collection "${WEAVIATE_CLASS_NAME}" does not exist.`));
    await client.close();
    return;
  }

  const config = await collection.config.get();
  console.log(`${chalk.bold('Collection:')} ${chalk.cyan.bold(WEAVIATE_CLASS_NAME)}\n`);

  console.log(chalk.bold('Properties:'));
  for (const prop of config.properties) {
    const dataType = (prop as any).dataType ?? 'unknown';
    console.log(`  ${chalk.cyan(prop.name)} ${chalk.dim(`(${dataType})`)}`);
  }

  console.log(`\n${chalk.bold('Vectorizers:')} ${chalk.dim(JSON.stringify(config.vectorizers))}`);

  console.log(`\n${chalk.bold('Full config:')}`);
  console.log(chalk.dim(JSON.stringify(config, null, 2)));

  await client.close();
}

main().catch((err) => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});
