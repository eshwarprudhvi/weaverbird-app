import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createMeeting = async (data) => {
  return await apiClient.post(ENDPOINTS.MEETINGS.LIST, data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const updateMeeting = async (meetingId, data) => {
  return await apiClient.patch(ENDPOINTS.MEETINGS.DETAIL(meetingId), data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const deleteMeeting = async (meetingId) => {
  return await apiClient.delete(ENDPOINTS.MEETINGS.DETAIL(meetingId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const getMeeting = async (meetingId) => {
  return await apiClient.get(ENDPOINTS.MEETINGS.DETAIL(meetingId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const listMeetings = async (query = {}) => {
  return await apiClient.get(ENDPOINTS.MEETINGS.LIST, {
    params: query,
    headers: { 'X-API-Version': '2' }
  });
};
