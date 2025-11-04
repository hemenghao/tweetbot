import { fetchFollowingByHandle } from './twitterService.js';
import { upsertMonitoredUsers } from './monitoredUserService.js';
import logger from '../utils/logger.js';

export const scanFollowingsAndPersist = async (handle: string) => {
  logger.info(`Scanning followings for @${handle}`);
  const followings = await fetchFollowingByHandle(handle);

  const profiles = followings.map((profile) => ({
    twitter_handle: profile.twitter_handle,
    user_id: profile.user_id,
    display_name: profile.display_name,
    profile: profile.profile,
  }));

  const result = await upsertMonitoredUsers(profiles, 'following_scan');
  logger.info(
    `Scan complete for @${handle}: inserted ${result.inserted}, updated ${result.updated}`
  );
  return result;
};
