import { findActiveUsers } from '../services/monitoredUserService.js';
import { analyzeTweetsForUser } from '../services/tweetAnalyzer.js';
import { getMonitoringConfig } from '../services/configService.js';
import logger from '../utils/logger.js';

let intervalId: NodeJS.Timeout | null = null;

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const runTweetScan = async () => {
  const users = await findActiveUsers();
  if (!users.length) {
    logger.info('No active users for tweet scan');
    return;
  }

  const config = await getMonitoringConfig();
  const chunks = chunkArray(users, config.scan_settings.max_concurrent_scans || 1);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (user) => {
        try {
          await analyzeTweetsForUser(user);
        } catch (error) {
          logger.error(
            `Failed to analyze tweets for @${user.twitter_handle}: ${(error as Error).message}`
          );
        }
      })
    );
  }
};

export const startTweetScanner = async () => {
  const config = await getMonitoringConfig();
  const intervalMinutes = config.scan_settings.scan_interval || 10;

  if (intervalId) {
    clearInterval(intervalId);
  }

  logger.info(`Starting tweet scanner job with interval ${intervalMinutes} minutes`);
  intervalId = setInterval(() => {
    runTweetScan().catch((error) => {
      logger.error(`Tweet scan job failed: ${(error as Error).message}`);
    });
  }, intervalMinutes * 60 * 1000);

  await runTweetScan();
};
