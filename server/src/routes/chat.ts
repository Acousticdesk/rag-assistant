import { Router, Request, Response, NextFunction } from 'express';
import { createLLMProvider } from '../services/llm';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, provider, apiKey } = req.body;

    if (!apiKey) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const llm = createLLMProvider(provider || 'openai');
    const reply = await llm.chat(messages, apiKey);

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});
