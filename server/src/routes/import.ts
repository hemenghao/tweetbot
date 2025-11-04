import { Router } from 'express';
import multer from 'multer';
import { importUsers } from '../services/importService.js';
import logger from '../utils/logger.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await importUsers(req.file.buffer, req.file.originalname);
    res.json({ message: 'Import completed', result });
  } catch (error) {
    logger.error(`Failed to import users: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to import users' });
  }
});

export default router;
