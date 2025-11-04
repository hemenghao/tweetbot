import { Router } from 'express';
import MonitoredUserModel from '../models/MonitoredUser.js';
import { analyzeTweetsForUser } from '../services/tweetAnalyzer.js';
import { runTweetScan } from '../jobs/tweetScannerJob.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/scan', async (req, res) => {
  try {
    const { handle } = req.body as { handle?: string };

    if (handle) {
      const normalized = handle.startsWith('@') ? handle.slice(1) : handle;
      const user = await MonitoredUserModel.findOne({ twitter_handle: normalized });
      if (!user) {
        return res.status(404).json({ message: 'User not monitored' });
      }
      await analyzeTweetsForUser(user);
      return res.json({ message: `Scan completed for @${normalized}` });
    }

    await runTweetScan();
    res.json({ message: 'Scan triggered for active users' });
  } catch (error) {
    logger.error(`Failed to run tweet scan: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to scan tweets' });
  }
});

export default router;
