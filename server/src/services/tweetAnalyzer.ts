import dayjs from 'dayjs';
import { MonitoredUserDocument, RecentMention } from '../models/MonitoredUser.js';
import TweetAnalysisModel, { TweetAnalysisDocument } from '../models/TweetAnalysis.js';
import { analyzeTweetContent } from './analysisEngine.js';
import {
  computeQualityRating,
  mergeQualityRating,
} from './qualityRatingService.js';
import { fetchRecentTweetsForUser } from './twitterService.js';
import { getMonitoringConfig } from './configService.js';
import {
  notifyHighQualityTweet,
} from './notificationService.js';
import logger from '../utils/logger.js';
import { refreshUserStats } from './monitoredUserService.js';

interface NotificationDecision {
  shouldNotify: boolean;
  reason?: string;
}

const determineNotification = (
  tweetAnalysis: TweetAnalysisDocument,
  qualityScore: number,
  rules: Awaited<ReturnType<typeof getMonitoringConfig>>['notification_rules']
): NotificationDecision => {
  const assets = tweetAnalysis.analysis.mentioned_assets.map((asset) => asset.symbol);
  const keywords = tweetAnalysis.analysis.keywords;
  const actionable = tweetAnalysis.analysis.is_actionable;

  if (!actionable) {
    return { shouldNotify: false };
  }

  if (qualityScore >= rules.min_quality_score) {
    return {
      shouldNotify: true,
      reason: `Quality score ${qualityScore} exceeds threshold ${rules.min_quality_score}`,
    };
  }

  const watchlistHit = assets.find((asset) => rules.asset_watchlist.includes(asset));
  if (watchlistHit) {
    return {
      shouldNotify: true,
      reason: `Watchlist asset ${watchlistHit} mentioned`,
    };
  }

  const keywordHit = keywords.find((keyword) =>
    rules.important_keywords.some((ruleKeyword) => keyword.includes(ruleKeyword.toLowerCase()))
  );

  if (keywordHit) {
    return {
      shouldNotify: true,
      reason: `Important keyword detected: ${keywordHit}`,
    };
  }

  return { shouldNotify: false };
};

const buildMentionsSummary = (
  analyses: Array<Pick<TweetAnalysisDocument, 'analysis' | 'content'>>
): RecentMention[] => {
  const mentionMap = new Map<string, RecentMention>();

  analyses.forEach((analysisDoc) => {
    analysisDoc.analysis.mentioned_assets.forEach((asset) => {
      const existing = mentionMap.get(asset.symbol);
      if (existing) {
        existing.mention_count += 1;
        existing.last_mentioned = analysisDoc.content.created_at;
      } else {
        mentionMap.set(asset.symbol, {
          symbol: asset.symbol,
          mention_count: 1,
          first_mentioned: analysisDoc.content.created_at,
          last_mentioned: analysisDoc.content.created_at,
        });
      }
    });
  });

  return Array.from(mentionMap.values()).sort((a, b) => b.mention_count - a.mention_count);
};

const deriveMainTopics = (analyses: TweetAnalysisDocument[]): string[] => {
  const topicCount = new Map<string, number>();
  analyses.forEach((doc) => {
    doc.analysis.topics.forEach((topic) => {
      topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
    });
  });
  const sorted = Array.from(topicCount.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([topic]) => topic);
};

const aggregateEngagement = (analyses: TweetAnalysisDocument[]): number => {
  if (!analyses.length) return 0;
  const total = analyses.reduce((acc, doc) => {
    const { likes, retweets, replies, views } = doc.engagement;
    return acc + likes + retweets * 2 + replies * 1.5 + views / 1000;
  }, 0);

  return Number((total / analyses.length).toFixed(2));
};

export const analyzeTweetsForUser = async (user: MonitoredUserDocument) => {
  const monitoringConfig = await getMonitoringConfig();
  const tweets = await fetchRecentTweetsForUser(
    user.twitter_handle,
    monitoringConfig.scan_settings.tweet_limit
  );

  if (!tweets.length) {
    logger.info(`No tweets returned for @${user.twitter_handle}`);
    return;
  }

  let userQuality = {
    score: user.quality_rating?.score ?? 0,
    accuracy: user.quality_rating?.accuracy ?? 0,
    influence: user.quality_rating?.influence ?? 0,
    timeliness: user.quality_rating?.timeliness ?? 0,
    last_updated: user.quality_rating?.last_updated ?? new Date(),
  };

  for (const tweet of tweets) {
    const tweetCreatedAt = dayjs(tweet.created_at).toDate();
    const analysisResult = analyzeTweetContent(tweet.text);

    const engagement = {
      likes: tweet.metrics?.likes || 0,
      retweets: tweet.metrics?.retweets || 0,
      replies: tweet.metrics?.replies || 0,
      views: tweet.metrics?.views || 0,
    };

    const qualityForTweet = computeQualityRating({
      analysis: analysisResult,
      engagement,
      user,
    }, tweetCreatedAt);

    userQuality = mergeQualityRating(userQuality, qualityForTweet);

    const documentPayload = {
      tweet_id: tweet.id,
      user_twitter_handle: user.twitter_handle,
      content: {
        text: tweet.text,
        created_at: tweetCreatedAt,
        lang: tweet.lang,
        media: tweet.media || [],
        urls: tweet.urls || [],
      },
      engagement,
      analysis: {
        mentioned_assets: analysisResult.mentioned_assets,
        topics: analysisResult.topics,
        sentiment_score: analysisResult.sentiment_score,
        quality_indicators: analysisResult.quality_indicators,
        keywords: analysisResult.keywords,
        is_actionable: analysisResult.is_actionable,
      },
      notification: {
        should_notify: false,
        notified: false,
      },
      analyzed_at: new Date(),
    };

    const storedAnalysis = await TweetAnalysisModel.findOneAndUpdate(
      { tweet_id: tweet.id },
      { $set: documentPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (storedAnalysis) {
      const decision = determineNotification(storedAnalysis, qualityForTweet.score, monitoringConfig.notification_rules);
      if (decision.shouldNotify && !storedAnalysis.notification.notified) {
        storedAnalysis.notification.should_notify = true;
        storedAnalysis.notification.notify_reason = decision.reason;
        await storedAnalysis.save();
        await notifyHighQualityTweet(storedAnalysis, decision.reason || 'High quality signal');
        storedAnalysis.notification.notified = true;
        storedAnalysis.notification.notified_at = new Date();
        await storedAnalysis.save();
      }
    }
  }

  const allAnalyses = await TweetAnalysisModel.find({ user_twitter_handle: user.twitter_handle });

  const mentions = buildMentionsSummary(allAnalyses);
  const mainTopics = deriveMainTopics(allAnalyses);
  const avgEngagement = aggregateEngagement(allAnalyses);
  const total = allAnalyses.length;
  const highQualityCount = allAnalyses.filter((doc) => doc.analysis.is_actionable).length;

  await refreshUserStats(
    user._id.toString(),
    {
      total_tweets_analyzed: total,
      high_quality_tweets: highQualityCount,
      avg_engagement: avgEngagement,
      last_scan_time: new Date(),
    },
    userQuality,
    mentions,
    mainTopics
  );

  logger.info(`Completed tweet analysis for @${user.twitter_handle}`);
};
