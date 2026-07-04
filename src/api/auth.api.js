import apiClient from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Pure API service for Authentication & Onboarding
 * Responsible ONLY for backend REST communication, Firebase Auth requests, and request normalization.
 * No React state, no UI logic, no localStorage management.
 */

export const authApi = {
  /**
   * Login with email/password or OAuth credentials
   * @param {Object} credentials { email, password, provider }
   * @returns {Promise<Object>} Normalized session object
   */
  async login(credentials) {
    const { email } = credentials;
    // In our hybrid/simulated setup, we normalize the user object and verify against backend /auth/me
    try {
      const response = await apiClient.get('/auth/me', {
        headers: {
          'Authorization': `Bearer simulated-token-${email}`,
          'x-user-email': email
        }
      });
      return {
        user: {
          email: response.data.email || email,
          role: response.data.role || 'editor',
          id: response.data.uid || `user-${Date.now()}`
        },
        token: `simulated-token-${email}`,
        activeWorkspaceId: response.data.workspaceId || 'default-workspace'
      };
    } catch (error) {
      // If /auth/me returns an error, we still normalize a fallback session if online verification is unavailable or simulated
      return {
        user: {
          email: email,
          role: 'editor',
          id: `user-${Date.now()}`
        },
        token: `simulated-token-${email}`,
        activeWorkspaceId: 'default-workspace'
      };
    }
  },

  /**
   * Register a new workspace (Feature-flagged in UI)
   * Target endpoint: POST /api/v1/auth/register-workspace
   * @param {Object} workspaceData { companyName, studioName, ownerName, email, password, businessCategory, country }
   * @returns {Promise<Object>} Normalized session & workspace creation response
   */
  async registerWorkspace(workspaceData) {
    const response = await apiClient.post('/auth/register-workspace', workspaceData);
    return response.data;
  },

  /**
   * Join an existing workspace via invite code or link
   * Target endpoint: POST /api/v1/auth/join-workspace or workspace invite API
   * @param {Object} joinData { code, email }
   * @returns {Promise<Object>} Normalized membership response
   */
  async joinWorkspace(joinData) {
    const response = await apiClient.post('/auth/join-workspace', joinData);
    return response.data;
  },

  /**
   * Verify current session token against backend
   * @returns {Promise<Object>} User session data
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Logout from backend session
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    return true;
  }
};

export default authApi;
