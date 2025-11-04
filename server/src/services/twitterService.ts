import axios from 'axios';
import dayjs from 'dayjs';
import { config } from '../config.js';
import logger from '../utils/logger.js';
import {
  getMockFollowingsForHandle,
  getMockTweetsForHandle,
  mockFollowings,
  MockTweet,
  MockUserProfile,
} from '../sample-data/mockData.js';

export interface TwitterProfile {
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
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  lang?: string;
  media?: string[];
  urls?: string[];
  metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
  };
}

const twitterApi = axios.create({
  baseURL: 'https://api.twitterapi.io',
});

const shouldUseMock = (): boolean => {
  return !config.twitterApiKey || config.twitterMockEnabled;
};

const withAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${config.twitterApiKey}`,
  },
});

const normalizeUserProfile = (user: any): TwitterProfile => ({
  twitter_handle: user?.username || user?.twitter_handle || '',
  user_id: String(user?.id || user?.user_id || ''),
  display_name: user?.name || user?.display_name || user?.username || '',
  profile: {
    bio: user?.description || user?.bio || '',
    followers_count: user?.public_metrics?.followers_count || user?.followers_count || 0,
    following_count: user?.public_metrics?.following_count || user?.following_count || 0,
    verified: Boolean(user?.verified),
    profile_image_url: user?.profile_image_url,
  },
});

const normalizeTweet = (tweet: any): TwitterTweet => ({
  id: String(tweet?.id || tweet?.tweet_id || ''),
  text: tweet?.text || '',
  created_at: tweet?.created_at || tweet?.created_at_date || dayjs().toISOString(),
  lang: tweet?.lang,
  media: tweet?.attachments?.media_keys || tweet?.media || [],
  urls:
    tweet?.entities?.urls?.map((item: any) => item?.expanded_url || item?.url || '') ||
    tweet?.urls ||
    [],
  metrics: {
    likes: tweet?.public_metrics?.like_count || tweet?.metrics?.likes || tweet?.like_count || 0,
    retweets:
      tweet?.public_metrics?.retweet_count || tweet?.metrics?.retweets || tweet?.retweet_count || 0,
    replies: tweet?.public_metrics?.reply_count || tweet?.metrics?.replies || tweet?.reply_count || 0,
    views:
      tweet?.public_metrics?.impression_count || tweet?.metrics?.views || tweet?.view_count || 0,
  },
});

const convertMockUser = (user: MockUserProfile): TwitterProfile => ({
  twitter_handle: user.twitter_handle,
  user_id: user.user_id,
  display_name: user.display_name,
  profile: { ...user.profile },
});

const convertMockTweet = (tweet: MockTweet): TwitterTweet => ({
  id: tweet.id,
  text: tweet.text,
  created_at: tweet.created_at,
  media: tweet.media,
  urls: tweet.urls,
  metrics: { ...tweet.metrics },
});

export const fetchFollowingByHandle = async (handle: string): Promise<TwitterProfile[]> => {
  if (shouldUseMock()) {
    logger.info(`Using mock following data for @${handle}`);
    return getMockFollowingsForHandle(handle).map(convertMockUser);
  }

  try {
    const response = await twitterApi.get(`/twitter/following/${handle}`, withAuthHeaders());
    const users = response.data?.data || response.data?.following || [];
    return users.map(normalizeUserProfile);
  } catch (error) {
    logger.warn(
      `Failed to fetch following list via TwitterAPI.io: ${(error as Error).message}. Falling back to mock data.`
    );
    return getMockFollowingsForHandle(handle).map(convertMockUser);
  }
};

export const fetchRecentTweetsForUser = async (
  handle: string,
  limit = 5
): Promise<TwitterTweet[]> => {
  if (shouldUseMock()) {
    logger.info(`Using mock tweets for @${handle}`);
    return getMockTweetsForHandle(handle).slice(0, limit).map(convertMockTweet);
  }

  try {
    const response = await twitterApi.get(`/twitter/user-tweets/${handle}?limit=${limit}`, withAuthHeaders());
    const tweets = response.data?.data || response.data?.tweets || [];
    return tweets.map(normalizeTweet).slice(0, limit);
  } catch (error) {
    logger.warn(
      `Failed to fetch tweets for @${handle} via TwitterAPI.io: ${(error as Error).message}. Using mock data.`
    );
    return getMockTweetsForHandle(handle).slice(0, limit).map(convertMockTweet);
  }
};

export const fetchUserProfile = async (handle: string): Promise<TwitterProfile | null> => {
  if (shouldUseMock()) {
    const direct = mockFollowings.find(
      (user) => user.twitter_handle.toLowerCase() === handle.toLowerCase()
    );
    if (direct) return convertMockUser(direct);
  }

  try {
    const response = await twitterApi.get(`/twitter/user/${handle}`, withAuthHeaders());
    if (!response.data) return null;
    return normalizeUserProfile(response.data?.data || response.data);
  } catch (error) {
    logger.warn(`Failed to fetch user profile for @${handle}: ${(error as Error).message}`);
    return null;
  }
};
