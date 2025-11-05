import type Redis from 'ioredis';
import { getRedisPublisher } from './redisClient.js';
import type { RedisClient } from './redisClient.js';
import logger from './logger.js';

export type StreamEntry = {
  id: string;
  values: Record<string, string>;
};

type AppendPayload = Record<string, unknown>;

type ConsumerGroupReadOptions = {
  stream: string;
  group: string;
  consumer: string;
  count?: number;
  blockMs?: number;
  client?: RedisClient;
};

type AcknowledgeOptions = {
  stream: string;
  group: string;
  ids: string[];
  client?: RedisClient;
};

const resolveClient = (client?: RedisClient): Redis => {
  return (client as Redis | undefined) ?? getRedisPublisher();
};

const serializePayload = (payload: AppendPayload): string[] => {
  const flattened: string[] = [];

  Object.entries(payload).forEach(([field, value]) => {
    if (value === undefined) {
      return;
    }

    if (value === null) {
      flattened.push(field, 'null');
      return;
    }

    if (typeof value === 'object') {
      flattened.push(field, JSON.stringify(value));
      return;
    }

    flattened.push(field, String(value));
  });

  if (flattened.length === 0) {
    throw new Error('Stream payload must contain at least one field');
  }

  return flattened;
};

const parseEntries = (rawEntries: [string, string[]][]): StreamEntry[] => {
  return rawEntries.map(([id, raw]) => {
    const values: Record<string, string> = {};

    for (let idx = 0; idx < raw.length; idx += 2) {
      const field = raw[idx];
      const value = raw[idx + 1];
      values[field] = value;
    }

    return {
      id,
      values,
    };
  });
};

export const appendToStream = async (
  stream: string,
  payload: AppendPayload,
  client?: RedisClient,
): Promise<string> => {
  const redis = resolveClient(client);
  const flattened = serializePayload(payload);

  const id = await redis.xadd(stream, '*', ...flattened);
  logger.debug(`Appended entry ${id} to stream '${stream}'`);

  return id;
};

export const createConsumerGroup = async (
  stream: string,
  group: string,
  client?: RedisClient,
  startId = '0',
): Promise<void> => {
  const redis = resolveClient(client);

  try {
    await redis.xgroup('CREATE', stream, group, startId, 'MKSTREAM');
    logger.info(`Created consumer group '${group}' for stream '${stream}'`);
  } catch (error) {
    const message = (error as Error).message ?? '';

    if (message.includes('BUSYGROUP')) {
      logger.debug(`Consumer group '${group}' for stream '${stream}' already exists`);
      return;
    }

    throw error;
  }
};

export const readGroup = async ({
  stream,
  group,
  consumer,
  count = 1,
  blockMs,
  client,
}: ConsumerGroupReadOptions): Promise<StreamEntry[]> => {
  const redis = resolveClient(client);

  const args: string[] = ['GROUP', group, consumer];

  if (count > 0) {
    args.push('COUNT', count.toString());
  }

  if (typeof blockMs === 'number' && blockMs >= 0) {
    args.push('BLOCK', blockMs.toString());
  }

  args.push('STREAMS', stream, '>');

  const response = await redis.xreadgroup(...args);

  if (!response) {
    return [];
  }

  const parsed = response.flatMap(([, entries]) => parseEntries(entries as [string, string[]][]));

  if (parsed.length > 0) {
    logger.debug(
      `Read ${parsed.length} entr${parsed.length === 1 ? 'y' : 'ies'} from stream '${stream}' (group '${group}', consumer '${consumer}')`,
    );
  }

  return parsed;
};

export const acknowledgeEntries = async ({
  stream,
  group,
  ids,
  client,
}: AcknowledgeOptions): Promise<number> => {
  if (ids.length === 0) {
    return 0;
  }

  const redis = resolveClient(client);

  const acknowledged = await redis.xack(stream, group, ...ids);

  if (acknowledged === 0) {
    logger.debug(
      `No pending entries were acknowledged for stream '${stream}' and group '${group}'. Possible duplicate ack attempt.`,
    );
  } else {
    logger.debug(`Acknowledged ${acknowledged} entr${acknowledged === 1 ? 'y' : 'ies'} for group '${group}' on stream '${stream}'`);
  }

  return acknowledged;
};
