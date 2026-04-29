import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const healthRouter = Router();

healthRouter.use(requireAuth);

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});
