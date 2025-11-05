import type RedisClient from 'ioredis';
import Redis from 'ioredis-mock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acknowledgeEntries,
  appendToStream,
  createConsumerGroup,
  readGroup,
} from '../src/utils/redisStream.js';

describe('redis stream helpers', () => {
  let client: RedisClient;

  beforeEach(() => {
    client = new Redis() as unknown as RedisClient;
  });

  afterEach(async () => {
    await client.quit();
  });

  it('creates a consumer group, appends entries, consumes and acknowledges them', async () => {
    const stream = 'test-stream';
    const group = 'cg-test';
    const consumer = 'consumer-1';

    const firstId = await appendToStream(stream, { foo: 'bar', count: 7 }, client);

    await createConsumerGroup(stream, group, client);
    await createConsumerGroup(stream, group, client); // idempotent

    const entries = await readGroup({
      stream,
      group,
      consumer,
      count: 10,
      blockMs: 0,
      client,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toEqual(firstId);
    expect(entries[0].values.foo).toEqual('bar');
    expect(entries[0].values.count).toEqual('7');

    const ackCount = await acknowledgeEntries({ stream, group, ids: entries.map((entry) => entry.id), client });
    expect(ackCount).toBe(1);

    const duplicateAck = await acknowledgeEntries({ stream, group, ids: [entries[0].id], client });
    expect(duplicateAck).toBe(0);
  });

  it('supports reading new entries after acknowledgements', async () => {
    const stream = 'stream-2';
    const group = 'cg-two';
    const consumer = 'consumer-2';

    await appendToStream(stream, { seed: 'initial' }, client);
    await createConsumerGroup(stream, group, client);

    const firstBatch = await readGroup({ stream, group, consumer, count: 5, blockMs: 0, client });
    await acknowledgeEntries({ stream, group, ids: firstBatch.map((entry) => entry.id), client });

    const secondId = await appendToStream(stream, { hello: 'world', nested: { ping: 'pong' } }, client);

    const secondBatch = await readGroup({ stream, group, consumer, count: 5, blockMs: 0, client });

    expect(secondBatch).toHaveLength(1);
    expect(secondBatch[0].id).toEqual(secondId);
    expect(JSON.parse(secondBatch[0].values.nested)).toEqual({ ping: 'pong' });
  });
});
