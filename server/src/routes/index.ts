import { Router } from 'express';
import monitoredUsersRouter from './monitoredUsers.js';
import monitoringConfigRouter from './monitoringConfig.js';
import twitterRouter from './twitter.js';
import importRouter from './import.js';
import analysisRouter from './analysis.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/users', monitoredUsersRouter);
router.use('/monitoring-config', monitoringConfigRouter);
router.use('/twitter', twitterRouter);
router.use('/import', importRouter);
router.use('/analysis', analysisRouter);

export default router;
