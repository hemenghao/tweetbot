import { MonitoredUserDocument } from '../models/MonitoredUser.js';
import { TweetAnalysisDocument } from '../models/TweetAnalysis.js';

interface QualityInputs {
  analysis: TweetAnalysisDocument['analysis'];
  engagement: TweetAnalysisDocument['engagement'];
  user: MonitoredUserDocument;
}

const normalize = (value: number, max: number) => Math.min(1, value / max);

const computeAccuracy = (analysis: TweetAnalysisDocument['analysis']): number => {
  const credibility = analysis.quality_indicators.credibility;
  const actionableBonus = analysis.is_actionable ? 0.2 : 0;
  return Math.min(1, credibility + actionableBonus);
};

const computeInfluence = (engagement: TweetAnalysisDocument['engagement'], user: MonitoredUserDocument): number => {
  const followers = user.profile.followers_count || 0;
  const followerScore = normalize(followers, 1_000_000);
  const engagementTotal = engagement.likes + engagement.retweets * 2 + engagement.replies * 1.5 + engagement.views / 1000;
  const engagementScore = normalize(engagementTotal, 10_000);
  return Math.min(1, (followerScore + engagementScore) / 2);
};

const computeTimeliness = (tweetCreatedAt: Date): number => {
  const now = Date.now();
  const diffMinutes = (now - tweetCreatedAt.getTime()) / (1000 * 60);
  if (diffMinutes <= 10) return 1;
  if (diffMinutes <= 60) return 0.8;
  if (diffMinutes <= 6 * 60) return 0.6;
  if (diffMinutes <= 24 * 60) return 0.4;
  return 0.2;
};

export const computeQualityRating = ({ analysis, engagement, user }: QualityInputs, tweetCreatedAt: Date) => {
  const accuracy = computeAccuracy(analysis);
  const influence = computeInfluence(engagement, user);
  const timeliness = computeTimeliness(tweetCreatedAt);

  const score = Math.round((accuracy * 0.4 + influence * 0.3 + timeliness * 0.3) * 100);

  return {
    score,
    accuracy: Math.round(accuracy * 100),
    influence: Math.round(influence * 100),
    timeliness: Math.round(timeliness * 100),
    last_updated: new Date(),
  };
};

export const mergeQualityRating = (
  existing: MonitoredUserDocument['quality_rating'],
  next: ReturnType<typeof computeQualityRating>
) => {
  const blended = {
    score: Math.round(existing.score * 0.6 + next.score * 0.4),
    accuracy: Math.round(existing.accuracy * 0.6 + next.accuracy * 0.4),
    influence: Math.round(existing.influence * 0.6 + next.influence * 0.4),
    timeliness: Math.round(existing.timeliness * 0.6 + next.timeliness * 0.4),
    last_updated: next.last_updated,
  };

  return blended;
};
