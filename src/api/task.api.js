import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createTask = async (data) => {
  return await apiClient.post(ENDPOINTS.TASKS.LIST, data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const updateTask = async (taskId, data) => {
  return await apiClient.patch(ENDPOINTS.TASKS.DETAIL(taskId), data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const deleteTask = async (taskId) => {
  return await apiClient.delete(ENDPOINTS.TASKS.DETAIL(taskId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const getTask = async (taskId) => {
  return await apiClient.get(ENDPOINTS.TASKS.DETAIL(taskId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const listTasks = async (query = {}) => {
  return await apiClient.get(ENDPOINTS.TASKS.LIST, {
    params: query,
    headers: { 'X-API-Version': '2' }
  });
};
