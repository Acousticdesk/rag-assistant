import weaviate, { type WeaviateClient } from 'weaviate-client';
import { config, parseBoolean } from '../../config.js';
import { logger } from '../../logger.js';

let weaviateClient: WeaviateClient | null = null;

function getDefaultHttpPort(url: URL): number {
  return url.protocol === 'https:' ? 443 : 80;
}

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (!weaviateClient) {
    const url = config.weaviate.url;
    const httpSecure = url.protocol === 'https:';
    const grpcSecure = parseBoolean(process.env.WEAVIATE_GRPC_SECURE) ?? httpSecure;
    const httpPath = url.pathname === '/' ? undefined : url.pathname.replace(/\/+$/, '');

    const grpcHost = process.env.WEAVIATE_GRPC_HOST ?? url.hostname;
    const grpcPort = Number(process.env.WEAVIATE_GRPC_PORT) || (grpcSecure ? 443 : 50051);
    const httpPort = Number(url.port) || getDefaultHttpPort(url);
    if (!config.weaviate.apiKey) {
      logger.warn(
        `Connecting to Weaviate at ${url.href} without an API key — set WEAVIATE_API_KEY if the instance requires authentication`,
      );
    }
    logger.info(`Connecting to Weaviate at ${url.href}`);
    logger.debug(
      `Weaviate params: httpHost=${url.hostname}, httpPort=${httpPort}, httpSecure=${httpSecure}, httpPath=${httpPath ?? '/'}, grpcHost=${grpcHost}, grpcPort=${grpcPort}, grpcSecure=${grpcSecure}, apiKey=${config.weaviate.apiKey ? 'set' : 'unset'}`,
    );
    weaviateClient = await weaviate.connectToCustom({
      httpHost: url.hostname,
      httpPath,
      httpPort,
      httpSecure,
      grpcHost,
      grpcPort,
      grpcSecure,
      ...(config.weaviate.apiKey
        ? { authCredentials: new weaviate.ApiKey(config.weaviate.apiKey) }
        : {}),
    });
    logger.info('Connected to Weaviate');
  }

  return weaviateClient;
}
