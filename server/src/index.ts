import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { healthRouter } from './routes/health.js';
import { chatRouter } from './routes/chat.js';
import { uploadRouter } from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config.js';
import { ensureWeaviateSchema } from './services/weaviate/ensureSchema.js';
import { logger } from './logger.js';
import { configurePassport } from './auth/passport.js';

const app = express();
const PORT = config.port;

configurePassport();
logger.info('Passport configured');
logger.debug(
  `Server config: port=${config.port}, dbPath=${config.dbPath}, weaviateUrl=${config.weaviate.url.href}`,
);

if (!config.auth.apiKey) {
  logger.warn('SERVER_API_KEY is not set — all authenticated requests will be rejected with 500');
}
if (!config.weaviate.apiKey) {
  logger.warn('WEAVIATE_API_KEY is not set — connecting to Weaviate without authentication');
}

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
logger.debug('Middleware registered: cors, json body parser, passport');

app.use('/health', healthRouter);
app.use('/chat', chatRouter);
app.use('/upload', uploadRouter);
logger.debug('Routes registered: /health, /chat, /upload');

app.use(errorHandler);

async function startServer(): Promise<void> {
  await ensureWeaviateSchema().catch((err) => {
    logger.error(`Weaviate schema initialization failed: ${err.message}`, err);
    throw err;
  });
  logger.info('Weaviate schema ready');

  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  logger.error(`Failed to initialize server: ${error.message}`, error);
  process.exit(1);
});
