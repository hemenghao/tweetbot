import { Router } from 'express';
import { scanFollowingsAndPersist } from '../services/followingScanService.js';
import { fetchRecentTweetsForUser } from '../services/twitterService.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/scan-followings', async (req, res) => {
  try {
    const { handle } = req.body;
    if (!handle) {
      return res.status(400).json({ message: 'Missing handle' });
    }

    const normalizedHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const result = await scanFollowingsAndPersist(normalizedHandle);

    res.json({ message: 'Followings scanned', result });
  } catch (error) {
    logger.error(`Failed to scan followings: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to scan followings' });
  }
});

router.get('/tweets/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const tweets = await fetchRecentTweetsForUser(handle, 5);
    res.json({ tweets });
  } catch (error) {
    logger.error(`Failed to fetch tweets: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to fetch tweets' });
  }
});

export default router;
