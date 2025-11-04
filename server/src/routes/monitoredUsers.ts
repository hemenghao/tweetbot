import { Router } from 'express';
import {
  listMonitoredUsers,
  updateMonitoringStatus,
  updateMonitoringStatusBatch,
  updateUserMetadata,
} from '../services/monitoredUserService.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const {
      search,
      status,
      sortBy,
      sortOrder,
      limit,
      offset,
    } = req.query as Record<string, string>;

    const isActive =
      typeof status === 'string'
        ? status === 'active'
          ? true
          : status === 'inactive'
          ? false
          : undefined
        : undefined;

    const result = await listMonitoredUsers({
      search,
      isActive,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json(result);
  } catch (error) {
    logger.error(`Failed to list monitored users: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to list monitored users' });
  }
});

router.patch('/:id/monitoring', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, scan_frequency } = req.body;

    const updated = await updateMonitoringStatus(id, {
      is_active,
      scan_frequency,
    });

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updated);
  } catch (error) {
    logger.error(`Failed to update monitoring status: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to update monitoring status' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, notes, main_topics } = req.body;
    const updated = await updateUserMetadata(id, { tags, notes, main_topics });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updated);
  } catch (error) {
    logger.error(`Failed to update user metadata: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to update user metadata' });
  }
});

router.post('/batch-monitoring', async (req, res) => {
  try {
    const { userIds, is_active } = req.body;
    if (!Array.isArray(userIds) || typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    const updated = await updateMonitoringStatusBatch(userIds, is_active);
    res.json({ updated });
  } catch (error) {
    logger.error(`Failed to batch update monitoring: ${(error as Error).message}`);
    res.status(500).json({ message: 'Failed to batch update monitoring' });
  }
});

export default router;
