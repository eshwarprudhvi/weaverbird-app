export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  WORKSPACE: {
    SETTINGS: '/workspace/profile',
    MEMBERS_INVITE: '/workspace/members/invite',
    MEMBER_ROLE: (userId) => `/workspace/members/${userId}/role`,
    MEMBER_REMOVE: (userId) => `/workspace/members/${userId}`,
  },
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (projectId) => `/projects/${projectId}`,
  },
  TASKS: {
    LIST: '/tasks',
    DETAIL: (taskId) => `/tasks/${taskId}`,
  },
  MEETINGS: {
    LIST: '/meetings',
    DETAIL: (meetingId) => `/meetings/${meetingId}`,
  },
  REPORTS: {
    BACKUP: '/reports/projects/backup',
  },
  ASSETS: {
    BASE: '/assets',
    DETAIL: (assetId) => `/assets/${assetId}`,
  },
  CATALOG: {
    LIST: '/catalog',
    DETAIL: (itemId) => `/catalog/${itemId}`,
  },
  INVITATIONS: {
    CREATE: '/invitations',
    LIST_WORKSPACE: '/invitations',
    LIST_MY: '/invitations/my',
    VALIDATE_TOKEN: (token) => `/invitations/token/${token}`,
    ACCEPT: (id) => `/invitations/${id}/accept`,
    DECLINE: (id) => `/invitations/${id}/decline`,
    CANCEL: (id) => `/invitations/${id}`,
    RESEND: (id) => `/invitations/${id}/resend`,
  }
};
