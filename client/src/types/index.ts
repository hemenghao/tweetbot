export interface QualityRating {
  score: number;
  accuracy: number;
  influence: number;
  timeliness: number;
  last_updated: string;
}

export interface MonitoredUserStats {
  total_tweets_analyzed: number;
  high_quality_tweets: number;
  avg_engagement: number;
  last_scan_time?: string | null;
}

export interface RecentMention {
  symbol: string;
  mention_count: number;
  first_mentioned: string;
  last_mentioned: string;
}

export interface MonitoringSettings {
  is_active: boolean;
  added_date: string;
  added_by: 'following_scan' | 'file_import' | 'manual';
  scan_frequency: 'real-time' | 'hourly' | 'daily';
}

export interface MonitoredUser {
  _id: string;
  twitter_handle: string;
  user_id: string;
  display_name: string;
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
  monitoring: MonitoringSettings;
  stats: MonitoredUserStats;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonitoringConfig {
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
}
