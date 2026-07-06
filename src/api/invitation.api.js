import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createInvitation = async (data) => {
  return await apiClient.post(ENDPOINTS.INVITATIONS.CREATE, data);
};

export const getWorkspaceInvitations = async () => {
  return await apiClient.get(ENDPOINTS.INVITATIONS.LIST_WORKSPACE);
};

export const getMyInvitations = async () => {
  return await apiClient.get(ENDPOINTS.INVITATIONS.LIST_MY);
};

export const validateToken = async (token) => {
  return await apiClient.get(ENDPOINTS.INVITATIONS.VALIDATE_TOKEN(token));
};

export const acceptInvitation = async (idOrToken) => {
  return await apiClient.post(ENDPOINTS.INVITATIONS.ACCEPT(idOrToken), { token: idOrToken });
};

export const declineInvitation = async (idOrToken) => {
  return await apiClient.post(ENDPOINTS.INVITATIONS.DECLINE(idOrToken), { token: idOrToken });
};

export const cancelInvitation = async (id) => {
  return await apiClient.delete(ENDPOINTS.INVITATIONS.CANCEL(id));
};

export const resendInvitation = async (id, data = {}) => {
  return await apiClient.post(ENDPOINTS.INVITATIONS.RESEND(id), data);
};

export default {
  createInvitation,
  getWorkspaceInvitations,
  getMyInvitations,
  validateToken,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  resendInvitation,
};
