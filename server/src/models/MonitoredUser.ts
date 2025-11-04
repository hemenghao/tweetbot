import mongoose, { Schema, Document, Model } from 'mongoose';

export interface RecentMention {
  symbol: string;
  mention_count: number;
  first_mentioned: Date;
  last_mentioned: Date;
}

export interface QualityRating {
  score: number;
  accuracy: number;
  influence: number;
  timeliness: number;
  last_updated: Date;
}

export interface MonitoringConfig {
  is_active: boolean;
  added_date: Date;
  added_by: 'following_scan' | 'file_import' | 'manual';
  scan_frequency: 'real-time' | 'hourly' | 'daily';
}

export interface MonitoredUserStats {
  total_tweets_analyzed: number;
  high_quality_tweets: number;
  avg_engagement: number;
  last_scan_time?: Date;
}

export interface MonitoredUserDocument extends Document {
  twitter_handle: string;
  user_id: string;
  display_name?: string;
  profile: {
    bio?: string;
    followers_count?: number;
    following_count?: number;
    verified?: boolean;
    profile_image_url?: string;
  };
  main_topics: string[];
  recent_mentions: RecentMention[];
  quality_rating: QualityRating;
  monitoring: MonitoringConfig;
  stats: MonitoredUserStats;
  tags: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const recentMentionSchema = new Schema<RecentMention>(
  {
    symbol: { type: String, required: true },
    mention_count: { type: Number, default: 1 },
    first_mentioned: { type: Date, default: () => new Date() },
    last_mentioned: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const qualityRatingSchema = new Schema<QualityRating>(
  {
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    influence: { type: Number, default: 0 },
    timeliness: { type: Number, default: 0 },
    last_updated: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const monitoringSchema = new Schema<MonitoringConfig>(
  {
    is_active: { type: Boolean, default: false },
    added_date: { type: Date, default: () => new Date() },
    added_by: {
      type: String,
      enum: ['following_scan', 'file_import', 'manual'],
      default: 'manual',
    },
    scan_frequency: {
      type: String,
      enum: ['real-time', 'hourly', 'daily'],
      default: 'hourly',
    },
  },
  { _id: false }
);

const statsSchema = new Schema<MonitoredUserStats>(
  {
    total_tweets_analyzed: { type: Number, default: 0 },
    high_quality_tweets: { type: Number, default: 0 },
    avg_engagement: { type: Number, default: 0 },
    last_scan_time: { type: Date },
  },
  { _id: false }
);

const monitoredUserSchema = new Schema<MonitoredUserDocument>(
  {
    twitter_handle: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    display_name: { type: String },
    profile: {
      bio: String,
      followers_count: Number,
      following_count: Number,
      verified: Boolean,
      profile_image_url: String,
    },
    main_topics: { type: [String], default: [] },
    recent_mentions: { type: [recentMentionSchema], default: [] },
    quality_rating: {
      type: qualityRatingSchema,
      default: () => ({
        score: 0,
        accuracy: 0,
        influence: 0,
        timeliness: 0,
        last_updated: new Date(),
      }),
    },
    monitoring: {
      type: monitoringSchema,
      default: () => ({
        is_active: false,
        added_date: new Date(),
        added_by: 'manual',
        scan_frequency: 'hourly',
      }),
    },
    stats: {
      type: statsSchema,
      default: () => ({
        total_tweets_analyzed: 0,
        high_quality_tweets: 0,
        avg_engagement: 0,
        last_scan_time: null,
      }),
    },
    tags: { type: [String], default: [] },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

monitoredUserSchema.index({ 'monitoring.is_active': 1 });
monitoredUserSchema.index({ twitter_handle: 1 });
monitoredUserSchema.index({ 'quality_rating.score': -1 });

export const MonitoredUserModel: Model<MonitoredUserDocument> =
  mongoose.models.MonitoredUser ||
  mongoose.model<MonitoredUserDocument>('MonitoredUser', monitoredUserSchema);

export default MonitoredUserModel;
