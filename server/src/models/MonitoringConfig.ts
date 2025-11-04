import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MonitoringConfigDocument extends Document {
  config_name: string;
  scan_settings: {
    tweet_limit: number;
    scan_interval: number;
    max_concurrent_scans: number;
  };
  notification_rules: {
    min_quality_score: number;
    important_keywords: string[];
    asset_watchlist: string[];
  };
  api_keys: {
    twitter_api_key: string;
    encrypted: boolean;
  };
  updated_at: Date;
}

const monitoringConfigSchema = new Schema<MonitoringConfigDocument>(
  {
    config_name: { type: String, required: true, unique: true },
    scan_settings: {
      tweet_limit: { type: Number, default: 5 },
      scan_interval: { type: Number, default: 10 },
      max_concurrent_scans: { type: Number, default: 3 },
    },
    notification_rules: {
      min_quality_score: { type: Number, default: 70 },
      important_keywords: { type: [String], default: [] },
      asset_watchlist: { type: [String], default: [] },
    },
    api_keys: {
      twitter_api_key: { type: String, required: true },
      encrypted: { type: Boolean, default: false },
    },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

export const MonitoringConfigModel: Model<MonitoringConfigDocument> =
  mongoose.models.MonitoringConfig ||
  mongoose.model<MonitoringConfigDocument>('MonitoringConfig', monitoringConfigSchema);

export default MonitoringConfigModel;
