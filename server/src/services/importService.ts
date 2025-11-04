import { parse } from 'csv-parse/sync';
import { upsertMonitoredUsers } from './monitoredUserService.js';
import logger from '../utils/logger.js';

interface ImportUserRecord {
  twitter_handle: string;
  display_name?: string;
}

const normalizeHandle = (handle: string): string => {
  const trimmed = handle.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
};

const parseCsv = (content: string): ImportUserRecord[] => {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((record: any) => ({
      twitter_handle: normalizeHandle(record.twitter_handle || record.handle || record.username || ''),
      display_name: record.display_name || record.name,
    }))
    .filter((record: ImportUserRecord) => Boolean(record.twitter_handle));
};

const parseJson = (content: string): ImportUserRecord[] => {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data
        .map((item: any) => ({
          twitter_handle: normalizeHandle(item.twitter_handle || item.handle || item.username || ''),
          display_name: item.display_name || item.name,
        }))
        .filter((record) => Boolean(record.twitter_handle));
    }

    logger.warn('JSON import payload is not an array. Skipping.');
    return [];
  } catch (error) {
    logger.error(`Failed to parse JSON import: ${(error as Error).message}`);
    return [];
  }
};

export const importUsers = async (
  content: Buffer,
  filename: string | undefined
): Promise<{ inserted: number; updated: number }> => {
  const text = content.toString('utf-8');
  const ext = filename?.split('.').pop()?.toLowerCase();

  let records: ImportUserRecord[] = [];
  if (ext === 'csv') {
    records = parseCsv(text);
  } else if (ext === 'json') {
    records = parseJson(text);
  } else {
    try {
      records = parseJson(text);
    } catch {
      records = parseCsv(text);
    }
  }

  const uniqueRecords = Array.from(
    records.reduce((map, record) => {
      if (!map.has(record.twitter_handle)) {
        map.set(record.twitter_handle, record);
      }
      return map;
    }, new Map<string, ImportUserRecord>()).values()
  );

  if (!uniqueRecords.length) {
    return { inserted: 0, updated: 0 };
  }

  const profiles = uniqueRecords.map((record) => ({
    twitter_handle: record.twitter_handle,
    user_id: record.twitter_handle.toLowerCase(),
    display_name: record.display_name || record.twitter_handle,
    profile: {
      bio: '',
      followers_count: 0,
      following_count: 0,
      verified: false,
      profile_image_url: '',
    },
  }));

  return upsertMonitoredUsers(profiles, 'file_import');
};
