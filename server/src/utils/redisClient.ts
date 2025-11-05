import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config.js';
import logger from './logger.js';

const trackedClients = new Map<Redis, string>();
let hooksRegistered = false;
let publisherInstance: Redis | null = null;

const registerShutdownHooks = () => {
  if (hooksRegistered) {
    return;
  }

  hooksRegistered = true;

  const shutdown = async (cause: NodeJS.Signals | 'beforeExit') => {
    if (trackedClients.size === 0) {
      return;
    }

    logger.info(`Shutting down Redis connections (cause: ${cause})`);

    await Promise.allSettled(
      Array.from(trackedClients.entries()).map(async ([client, name]) => {
        if (client.status === 'end') {
          return;
        }

        try {
          await client.quit();
          logger.info(`Redis connection '${name}' closed`);
        } catch (error) {
          logger.error(`Failed to close redis connection '${name}': ${(error as Error).message}`);
        } finally {
          trackedClients.delete(client);
        }
      }),
    );
  };

  const exitSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  exitSignals.forEach((signal) => {
    process.once(signal, () => {
      void shutdown(signal).finally(() => {
        process.exit(0);
      });
    });
  });

  process.once('beforeExit', () => {
    void shutdown('beforeExit');
  });
};

const ensureRedisUrl = (): string => {
  const { url } = config.redis;

  if (!url) {
    throw new Error('Redis configuration is missing. Set REDIS_URL in the environment.');
  }

  return url;
};

const buildOptions = (): RedisOptions => {
  const options: RedisOptions = {
    enableAutoPipelining: true,
  };

  if (config.redis.tls) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  return options;
};

const instrumentClient = (client: Redis, name: string) => {
  client.on('connect', () => {
    logger.info(`Redis connection '${name}' established`);
  });

  client.on('ready', () => {
    logger.debug(`Redis connection '${name}' ready`);
  });

  client.on('error', (error: Error) => {
    logger.error(`Redis connection '${name}' error: ${error.message}`);
  });

  client.on('close', () => {
    logger.warn(`Redis connection '${name}' closed`);
  });

  client.on('end', () => {
    trackedClients.delete(client);

    if (publisherInstance === client) {
      publisherInstance = null;
    }

    logger.info(`Redis connection '${name}' ended`);
  });

  client.on('reconnecting', (delay: number) => {
    logger.warn(`Redis connection '${name}' reconnecting in ${delay}ms`);
  });
};

const createClient = (name: string): Redis => {
  const url = ensureRedisUrl();
  const client = new Redis(url, buildOptions());

  registerShutdownHooks();
  trackedClients.set(client, name);
  instrumentClient(client, name);

  return client;
};

export const getRedisPublisher = (): Redis => {
  if (!publisherInstance) {
    publisherInstance = createClient('publisher');
  }

  return publisherInstance;
};

export const createRedisConsumer = (name: string): Redis => {
  return createClient(`consumer:${name}`);
};

export const disconnectRedis = async () => {
  const clients = Array.from(trackedClients.keys());
  await Promise.allSettled(
    clients.map(async (client) => {
      if (client.status !== 'end') {
        try {
          await client.quit();
        } catch (error) {
          logger.error(`Error disconnecting redis client: ${(error as Error).message}`);
        }
      }
    }),
  );

  trackedClients.clear();
  publisherInstance = null;
};

export type RedisClient = Redis;
