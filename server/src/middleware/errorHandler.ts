import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error(message, err);

  res.status(500).json({ error: message });
}
