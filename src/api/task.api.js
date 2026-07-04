import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createTask = async (data) => {
  return await apiClient.post(ENDPOINTS.TASKS.LIST, data);
};

export const updateTask = async (taskId, data) => {
  return await apiClient.patch(ENDPOINTS.TASKS.DETAIL(taskId), data);
};

export const deleteTask = async (taskId) => {
  return await apiClient.delete(ENDPOINTS.TASKS.DETAIL(taskId));
};
