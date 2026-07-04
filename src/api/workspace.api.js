import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const updateWorkspaceSettings = async (workspaceId, data) => {
  return await apiClient.patch(ENDPOINTS.WORKSPACE.SETTINGS, data);
};

export const inviteMember = async (workspaceId, email, role) => {
  return await apiClient.post(ENDPOINTS.WORKSPACE.MEMBERS_INVITE, { email, role });
};

export const updateMemberRole = async (workspaceId, userId, role) => {
  return await apiClient.patch(ENDPOINTS.WORKSPACE.MEMBER_ROLE(userId), { role });
};

export const removeMember = async (workspaceId, userId) => {
  return await apiClient.delete(ENDPOINTS.WORKSPACE.MEMBER_REMOVE(userId));
};
