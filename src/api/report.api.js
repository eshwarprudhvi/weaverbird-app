import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const requestBackupReport = async (targetEmail) => {
  return await apiClient.post(ENDPOINTS.REPORTS.BACKUP, { targetEmail });
};
