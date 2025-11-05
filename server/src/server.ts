import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { connectToDatabase } from './db/connection.js';
import { config } from './config.js';
import logger from './utils/logger.js';
import { startTweetScanner } from './jobs/tweetScannerJob.js';
import { getMonitoringConfig } from './services/configService.js';
import { bootstrap } from './startup/bootstrap.js';
import { getRedisPublisher } from './utils/redisClient.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('tiny'));

  app.use('/api', routes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
};

export const startServer = async () => {
  await connectToDatabase();
  await getMonitoringConfig();
  await bootstrap();

  if (config.redis.url) {
    try {
      const publisher = getRedisPublisher();
      await publisher.ping();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error(`Failed to establish Redis connection: ${(error as Error).message}`);
      throw error;
    }
  } else {
    logger.warn('REDIS_URL not configured; Redis-backed features are disabled.');
  }

  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
  });

  await startTweetScanner();
};
