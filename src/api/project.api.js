import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createProject = async (data) => {
  return await apiClient.post(ENDPOINTS.PROJECTS.LIST, data);
};

export const updateProject = async (projectId, data) => {
  return await apiClient.patch(ENDPOINTS.PROJECTS.DETAIL(projectId), data);
};

export const deleteProject = async (projectId) => {
  return await apiClient.delete(ENDPOINTS.PROJECTS.DETAIL(projectId));
};
