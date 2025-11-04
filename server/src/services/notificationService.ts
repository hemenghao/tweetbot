import axios from 'axios';
import logger from '../utils/logger.js';
import { config } from '../config.js';
import { TweetAnalysisDocument } from '../models/TweetAnalysis.js';

export interface NotificationPayload {
  title: string;
  message: string;
  importance: 'low' | 'medium' | 'high';
  data?: Record<string, unknown>;
}

const sendWebhook = async (payload: NotificationPayload) => {
  if (!config.notification.webhookUrl) {
    return;
  }
  try {
    await axios.post(config.notification.webhookUrl, payload, {
      timeout: 5000,
    });
    logger.info(`Notification webhook sent: ${payload.title}`);
  } catch (error) {
    logger.warn(`Failed to send notification webhook: ${(error as Error).message}`);
  }
};

export const notifyHighQualityTweet = async (
  analysis: TweetAnalysisDocument,
  reason: string
): Promise<void> => {
  const payload: NotificationPayload = {
    title: `High-quality tweet from @${analysis.user_twitter_handle}`,
    message: `${reason}\nTweet: ${analysis.content.text}`,
    importance: 'high',
    data: {
      tweet_id: analysis.tweet_id,
      sentiment: analysis.analysis.sentiment_score,
      assets: analysis.analysis.mentioned_assets,
    },
  };

  logger.info(`Notification triggered: ${payload.title}`);
  await sendWebhook(payload);
};
