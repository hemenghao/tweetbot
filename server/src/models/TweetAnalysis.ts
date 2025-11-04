import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MentionedAsset {
  symbol: string;
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export interface QualityIndicators {
  has_data: boolean;
  has_reasoning: boolean;
  is_original: boolean;
  credibility: number;
}

export interface TweetAnalysisDocument extends Document {
  tweet_id: string;
  user_twitter_handle: string;
  content: {
    text: string;
    created_at: Date;
    lang?: string;
    media: string[];
    urls: string[];
  };
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  analysis: {
    mentioned_assets: MentionedAsset[];
    topics: string[];
    sentiment_score: number;
    quality_indicators: QualityIndicators;
    keywords: string[];
    is_actionable: boolean;
  };
  notification: {
    should_notify: boolean;
    notified: boolean;
    notify_reason?: string;
    notified_at?: Date;
  };
  analyzed_at: Date;
  created_at: Date;
}

const mentionedAssetSchema = new Schema<MentionedAsset>(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    sentiment: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
      default: 'neutral',
    },
    confidence: { type: Number, default: 0 },
  },
  { _id: false }
);

const qualityIndicatorsSchema = new Schema<QualityIndicators>(
  {
    has_data: { type: Boolean, default: false },
    has_reasoning: { type: Boolean, default: false },
    is_original: { type: Boolean, default: false },
    credibility: { type: Number, default: 0 },
  },
  { _id: false }
);

const tweetAnalysisSchema = new Schema<TweetAnalysisDocument>(
  {
    tweet_id: { type: String, required: true, unique: true },
    user_twitter_handle: { type: String, required: true },
    content: {
      text: { type: String, required: true },
      created_at: { type: Date, required: true },
      lang: { type: String },
      media: { type: [String], default: [] },
      urls: { type: [String], default: [] },
    },
    engagement: {
      likes: { type: Number, default: 0 },
      retweets: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    analysis: {
      mentioned_assets: { type: [mentionedAssetSchema], default: [] },
      topics: { type: [String], default: [] },
      sentiment_score: { type: Number, default: 0 },
      quality_indicators: {
        type: qualityIndicatorsSchema,
        default: () => ({})
      },
      keywords: { type: [String], default: [] },
      is_actionable: { type: Boolean, default: false },
    },
    notification: {
      should_notify: { type: Boolean, default: false },
      notified: { type: Boolean, default: false },
      notify_reason: { type: String },
      notified_at: { type: Date },
    },
    analyzed_at: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

tweetAnalysisSchema.index({ user_twitter_handle: 1, analyzed_at: -1 });

export const TweetAnalysisModel: Model<TweetAnalysisDocument> =
  mongoose.models.TweetAnalysis ||
  mongoose.model<TweetAnalysisDocument>('TweetAnalysis', tweetAnalysisSchema);

export default TweetAnalysisModel;
