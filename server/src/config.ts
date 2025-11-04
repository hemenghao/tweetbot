import dotenv from 'dotenv';

dotenv.config();

const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: getNumber(process.env.PORT, 4000),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/twitter_monitor',
  twitterApiKey: process.env.TWITTER_API_KEY || '',
  twitterMockEnabled: process.env.TWITTER_USE_MOCK === 'true',
  twitterMockSeedHandle: process.env.TWITTER_SEED_HANDLE || 'InfoEchoes',
  defaultScanIntervalMinutes: getNumber(process.env.SCAN_INTERVAL_MINUTES, 10),
  notification: {
    webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
    email: process.env.NOTIFICATION_EMAIL,
    queueTopic: process.env.NOTIFICATION_QUEUE_TOPIC,
  },
};

export const defaultMonitoringConfig = {
  config_name: 'default',
  scan_settings: {
    tweet_limit: 5,
    scan_interval: config.defaultScanIntervalMinutes,
    max_concurrent_scans: 3,
  },
  notification_rules: {
    min_quality_score: 70,
    important_keywords: [
      'alpha',
      'breaking',
      'airdrop',
      'token generation event',
      'listing',
    ],
    asset_watchlist: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'],
  },
  api_keys: {
    twitter_api_key: config.twitterApiKey,
    encrypted: false,
  },
};
