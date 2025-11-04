import { Router } from 'express';
import {
  getMonitoringConfig,
  updateMonitoringConfig,
  UpdateMonitoringConfigPayload,
} from '../services/configService.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const config = await getMonitoringConfig();
    res.json(config);
  } catch (error) {
    logger.error(`Failed to fetch monitoring config: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to fetch config' });
  }
});

router.put('/', async (req, res) => {
  try {
    const payload = req.body as UpdateMonitoringConfigPayload;
    const updated = await updateMonitoringConfig(payload);
    res.json(updated);
  } catch (error) {
    logger.error(`Failed to update monitoring config: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to update config' });
  }
});

export default router;
