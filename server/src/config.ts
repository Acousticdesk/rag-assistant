import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 3001;
const DEFAULT_DB_PATH = 'dev.db';
const DEFAULT_WEAVIATE_URL = 'http://localhost:8080';

export const config = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  dbPath: process.env.DB_PATH ?? DEFAULT_DB_PATH,
  auth: {
    apiKey: process.env.SERVER_API_KEY ?? process.env.API_KEY,
  },
  weaviate: {
    url: new URL(process.env.WEAVIATE_URL ?? DEFAULT_WEAVIATE_URL),
    apiKey: process.env.WEAVIATE_API_KEY,
  },
};

export const WEAVIATE_HOST = `${config.weaviate.url.host}${config.weaviate.url.pathname === '/' ? '' : config.weaviate.url.pathname.replace(/\/+$/, '')}`;
export const WEAVIATE_SCHEME = config.weaviate.url.protocol.replace(':', '');

export function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
}
