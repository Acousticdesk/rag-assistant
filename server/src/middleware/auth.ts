import type { RequestHandler } from 'express';
import passport from 'passport';
import { config } from '../config.js';
import { logger } from '../logger.js';

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!config.auth.apiKey) {
    logger.debug('requireAuth: SERVER_API_KEY not configured, rejecting');
    res.status(500).json({ error: 'Server auth is not configured (SERVER_API_KEY is missing).' });
    return;
  }

  logger.debug(`requireAuth: authenticating ${req.method} ${req.path}`);
  passport.authenticate('bearer', { session: false })(req, res, next);
};
