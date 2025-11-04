import { FilterQuery, UpdateQuery } from 'mongoose';
import MonitoredUserModel, {
  MonitoredUserDocument,
  MonitoringConfig as MonitoringSettings,
  RecentMention,
} from '../models/MonitoredUser.js';
import logger from '../utils/logger.js';

interface ListUsersOptions {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const upsertMonitoredUsers = async (
  profiles: Array<{
    twitter_handle: string;
    user_id: string;
    display_name: string;
    profile: MonitoredUserDocument['profile'];
  }>,
  addedBy: MonitoringSettings['added_by']
) => {
  const operations = profiles.map((profile) => ({
    updateOne: {
      filter: { twitter_handle: profile.twitter_handle },
      update: {
        $setOnInsert: {
          twitter_handle: profile.twitter_handle,
          user_id: profile.user_id,
          display_name: profile.display_name,
          profile: profile.profile,
          monitoring: {
            is_active: false,
            added_date: new Date(),
            added_by: addedBy,
            scan_frequency: 'hourly',
          },
          stats: {
            total_tweets_analyzed: 0,
            high_quality_tweets: 0,
            avg_engagement: 0,
          },
          quality_rating: {
            score: 0,
            accuracy: 0,
            influence: 0,
            timeliness: 0,
            last_updated: new Date(),
          },
          main_topics: [],
          recent_mentions: [],
          tags: [],
        },
        $set: {
          display_name: profile.display_name,
          profile: profile.profile,
          updated_at: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (!operations.length) return { inserted: 0, updated: 0 };

  const result = await MonitoredUserModel.bulkWrite(operations, { ordered: false });
  logger.info(`Upserted ${result.nUpserted} monitored users from ${addedBy}`);
  return { inserted: result.nUpserted, updated: result.nModified };
};

export const listMonitoredUsers = async ({
  search,
  isActive,
  sortBy = 'quality_rating.score',
  sortOrder = 'desc',
  limit = 50,
  offset = 0,
}: ListUsersOptions) => {
  const filter: FilterQuery<MonitoredUserDocument> = {};

  if (typeof isActive === 'boolean') {
    filter['monitoring.is_active'] = isActive;
  }

  if (search) {
    filter.$or = [
      { twitter_handle: { $regex: search, $options: 'i' } },
      { display_name: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    MonitoredUserModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
    MonitoredUserModel.countDocuments(filter),
  ]);

  return { items, total };
};

export const updateMonitoringStatus = async (
  id: string,
  monitoring: Partial<MonitoringSettings>
) => {
  const setPayload: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (typeof monitoring.is_active === 'boolean') {
    setPayload['monitoring.is_active'] = monitoring.is_active;
  }

  if (monitoring.scan_frequency) {
    setPayload['monitoring.scan_frequency'] = monitoring.scan_frequency;
  }

  const payload: UpdateQuery<MonitoredUserDocument> = {
    $set: setPayload,
  };
  const result = await MonitoredUserModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

export const updateMonitoringStatusBatch = async (
  ids: string[],
  isActive: boolean
) => {
  const result = await MonitoredUserModel.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        'monitoring.is_active': isActive,
        updated_at: new Date(),
      },
    }
  );
  return result.modifiedCount;
};

export const updateUserMetadata = async (
  id: string,
  data: Partial<Pick<MonitoredUserDocument, 'tags' | 'notes' | 'main_topics'>>
) => {
  const result = await MonitoredUserModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(data.tags ? { tags: data.tags } : {}),
        ...(typeof data.notes !== 'undefined' ? { notes: data.notes } : {}),
        ...(data.main_topics ? { main_topics: data.main_topics } : {}),
        updated_at: new Date(),
      },
    },
    { new: true }
  );
  return result;
};

export const refreshUserStats = async (
  userId: string,
  update: Partial<MonitoredUserDocument['stats']>,
  quality_rating: Partial<MonitoredUserDocument['quality_rating']>,
  mentions: RecentMention[],
  mainTopics: string[]
) => {
  const result = await MonitoredUserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        'stats.total_tweets_analyzed': update.total_tweets_analyzed,
        'stats.high_quality_tweets': update.high_quality_tweets,
        'stats.avg_engagement': update.avg_engagement,
        'stats.last_scan_time': update.last_scan_time,
        'quality_rating.score': quality_rating.score,
        'quality_rating.accuracy': quality_rating.accuracy,
        'quality_rating.influence': quality_rating.influence,
        'quality_rating.timeliness': quality_rating.timeliness,
        'quality_rating.last_updated': quality_rating.last_updated,
        recent_mentions: mentions,
        main_topics: mainTopics,
        updated_at: new Date(),
      },
    },
    { new: true }
  );

  return result;
};

export const findActiveUsers = async () => {
  return MonitoredUserModel.find({ 'monitoring.is_active': true });
};

export const ensureUserExists = async (
  profile: {
    twitter_handle: string;
    user_id: string;
    display_name: string;
    profile: MonitoredUserDocument['profile'];
  }
) => {
  const existing = await MonitoredUserModel.findOne({ twitter_handle: profile.twitter_handle });
  if (existing) {
    if (!existing.monitoring.is_active) {
      existing.monitoring.is_active = true;
      existing.monitoring.added_by = existing.monitoring.added_by || 'manual';
      existing.monitoring.added_date = existing.monitoring.added_date || new Date();
      await existing.save();
    }
    return existing;
  }

  return MonitoredUserModel.create({
    ...profile,
    monitoring: {
      is_active: true,
      added_date: new Date(),
      added_by: 'manual',
      scan_frequency: 'hourly',
    },
    stats: {
      total_tweets_analyzed: 0,
      high_quality_tweets: 0,
      avg_engagement: 0,
    },
    quality_rating: {
      score: 0,
      accuracy: 0,
      influence: 0,
      timeliness: 0,
      last_updated: new Date(),
    },
  });
};
