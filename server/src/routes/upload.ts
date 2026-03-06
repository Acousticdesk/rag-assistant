import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadRouter = Router();

uploadRouter.post('/', upload.single('file'), (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Stub: RAG ingestion pipeline will be wired here
    res.json({
      message: 'File received',
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});
