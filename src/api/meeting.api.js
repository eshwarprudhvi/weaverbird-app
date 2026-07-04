import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createMeeting = async (data) => {
  return await apiClient.post(ENDPOINTS.MEETINGS.LIST, data);
};

export const updateMeeting = async (meetingId, data) => {
  return await apiClient.patch(ENDPOINTS.MEETINGS.DETAIL(meetingId), data);
};

export const deleteMeeting = async (meetingId) => {
  return await apiClient.delete(ENDPOINTS.MEETINGS.DETAIL(meetingId));
};
