import MonitoringConfigModel, { MonitoringConfigDocument } from '../models/MonitoringConfig.js';
import { config, defaultMonitoringConfig } from '../config.js';

export interface UpdateMonitoringConfigPayload {
  scan_settings?: Partial<MonitoringConfigDocument['scan_settings']>;
  notification_rules?: Partial<MonitoringConfigDocument['notification_rules']>;
}

export const getMonitoringConfig = async (): Promise<MonitoringConfigDocument> => {
  const existing = await MonitoringConfigModel.findOne({ config_name: 'default' });
  if (existing) return existing;
  return MonitoringConfigModel.create({
    ...defaultMonitoringConfig,
    api_keys: {
      twitter_api_key: config.twitterApiKey,
      encrypted: false,
    },
  });
};

export const updateMonitoringConfig = async (
  payload: UpdateMonitoringConfigPayload
): Promise<MonitoringConfigDocument> => {
  const current = await getMonitoringConfig();

  if (payload.scan_settings) {
    current.scan_settings = {
      ...current.scan_settings,
      ...payload.scan_settings,
    };
  }

  if (payload.notification_rules) {
    current.notification_rules = {
      ...current.notification_rules,
      ...payload.notification_rules,
    };
  }

  await current.save();
  return current;
};
