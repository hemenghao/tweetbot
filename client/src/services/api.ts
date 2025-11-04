import axios from 'axios';
import { MonitoredUser, MonitoringConfig } from '../types/index';

type ListResponse<T> = {
  items: T[];
  total: number;
};

type ListUsersParams = {
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

const api = axios.create({
  baseURL: '/api',
});

export const fetchMonitoredUsers = async (
  params: ListUsersParams
): Promise<ListResponse<MonitoredUser>> => {
  const response = await api.get<ListResponse<MonitoredUser>>('/users', { params });
  return response.data;
};

export const updateMonitoring = async (
  id: string,
  payload: { is_active?: boolean; scan_frequency?: 'real-time' | 'hourly' | 'daily' }
) => {
  const response = await api.patch<MonitoredUser>(`/users/${id}/monitoring`, payload);
  return response.data;
};

export const updateUserDetails = async (
  id: string,
  payload: { tags?: string[]; notes?: string; main_topics?: string[] }
) => {
  const response = await api.patch<MonitoredUser>(`/users/${id}`, payload);
  return response.data;
};

export const batchUpdateMonitoring = async (payload: { userIds: string[]; is_active: boolean }) => {
  const response = await api.post<{ updated: number }>(`/users/batch-monitoring`, payload);
  return response.data;
};

export const scanFollowings = async (handle: string) => {
  const response = await api.post('/twitter/scan-followings', { handle });
  return response.data;
};

export const importUsersFromFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const triggerTweetScan = async (handle?: string) => {
  const payload = handle ? { handle } : {};
  const response = await api.post('/analysis/scan', payload);
  return response.data;
};

export const fetchMonitoringConfig = async () => {
  const response = await api.get<MonitoringConfig>('/monitoring-config');
  return response.data;
};

export const updateMonitoringConfigRequest = async (
  payload: {
    scan_settings?: Partial<MonitoringConfig['scan_settings']>;
    notification_rules?: Partial<MonitoringConfig['notification_rules']>;
  }
) => {
  const response = await api.put<MonitoringConfig>('/monitoring-config', payload);
  return response.data;
};
