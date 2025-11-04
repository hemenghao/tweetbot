import { config } from '../config.js';
import logger from '../utils/logger.js';
import { scanFollowingsAndPersist } from '../services/followingScanService.js';
import { fetchUserProfile } from '../services/twitterService.js';
import { ensureUserExists } from '../services/monitoredUserService.js';

export const bootstrap = async () => {
  const seedHandle = config.twitterMockSeedHandle || 'InfoEchoes';
  logger.info(`Bootstrap: ensuring @${seedHandle} is monitored`);

  const profile = await fetchUserProfile(seedHandle);
  if (profile) {
    await ensureUserExists({
      twitter_handle: profile.twitter_handle,
      user_id: profile.user_id,
      display_name: profile.display_name,
      profile: profile.profile,
    });
  }

  await scanFollowingsAndPersist(seedHandle);

  logger.info('Bootstrap completed');
};
