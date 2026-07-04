import axios from 'axios';
import { API_BASE_URL } from './endpoints';
import offlineQueue from './offlineQueue';
import { APPLICATION } from '../config/application';

/**
 * Creates the base Axios instance
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor
 * Injects Firebase ID Token and current Workspace ID
 */
apiClient.interceptors.request.use(async (config) => {
  // Since the UI uses a custom email-based auth simulation rather than true Firebase Auth,
  // we pass a simulated token containing the email.
  const userEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
  if (userEmail) {
    config.headers.Authorization = `Bearer simulated-token-${userEmail}`;
    config.headers['x-user-email'] = userEmail; // For convenience
  }

  // Attempt to read workspaceId from localStorage (which is where useWorkspace stores it)
  // Or fallback to default-workspace if the app hasn't been configured for multi-tenant yet
  const storedWorkspaceId = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId) || 'default-workspace';
  config.headers['x-workspace-id'] = storedWorkspaceId;

  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Response Interceptor
 * Normalizes errors and catches network failures for offline queuing
 */
apiClient.interceptors.response.use(
  (response) => {
    // Standardize successful response unwrapping
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a network error (no response) and it's a mutation (POST, PATCH, DELETE, PUT)
    const isNetworkError = !error.response;
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(originalRequest.method?.toLowerCase());

    if (isNetworkError && isMutation && !originalRequest._retry) {
      // Enqueue the request to be retried when online
      await offlineQueue.enqueue(originalRequest);
      
      // We throw a specific offline error so the UI knows it was queued instead of failed outright
      const offlineError = new Error('Network offline. Request queued for sync.');
      offlineError.isQueued = true;
      return Promise.reject(offlineError);
    }

    // Normalize Server Errors
    const normalizedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.errors?.[0]?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      original: error
    };

    // Handle 401 Unauthorized globally (e.g. force logout)
    if (normalizedError.status === 401) {
      console.error('[API] Unauthorized. Session may be expired.');
      // Optional: Dispatch event to trigger UI logout
      window.dispatchEvent(new Event('app:auth-expired'));
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
