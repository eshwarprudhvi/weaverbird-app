import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, isConfigured } from '../firebase';

export const authApi = {
  /**
   * Login with email/password
   */
  async login(credentials) {
    const { email, password } = credentials;
    let userCredential;
    
    if (isConfigured && auth) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }
    
    const token = isConfigured ? await userCredential.user.getIdToken() : `simulated-token-${email}`;
    const uid = isConfigured ? userCredential.user.uid : `user-${Date.now()}`;
    
    try {
      const response = await apiClient.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-email': email
        }
      });
      return {
        user: {
          email: response.data.user?.email || email,
          role: response.data.currentMembership?.role || 'editor',
          id: response.data.user?.uid || uid
        },
        token,
        activeWorkspaceId: response.data.currentMembership?.workspaceId || null
      };
    } catch (error) {
      return {
        user: { email, role: 'editor', id: uid },
        token,
        activeWorkspaceId: null
      };
    }
  },

  /**
   * Register a new account with email/password
   */
  async register(credentials) {
    const { email, password } = credentials;
    let userCredential;
    
    if (isConfigured && auth) {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }
    
    const token = isConfigured ? await userCredential.user.getIdToken() : `simulated-token-${email}`;
    const uid = isConfigured ? userCredential.user.uid : `user-${Date.now()}`;
    
    return {
      user: { email, role: 'editor', id: uid },
      token,
      activeWorkspaceId: null // newly registered user has no workspace
    };
  },

  /**
   * Login or Register with Google
   */
  async loginWithGoogle() {
    let userCredential;
    let email = "google.user@example.com";
    let token = "simulated-google-token";
    let uid = `user-${Date.now()}`;
    
    if (isConfigured && auth) {
      const provider = new GoogleAuthProvider();
      userCredential = await signInWithPopup(auth, provider);
      email = userCredential.user.email;
      token = await userCredential.user.getIdToken();
      uid = userCredential.user.uid;
    }
    
    try {
      const response = await apiClient.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-email': email
        }
      });
      return {
        user: {
          email: response.data.user?.email || email,
          role: response.data.currentMembership?.role || 'editor',
          id: response.data.user?.uid || uid
        },
        token,
        activeWorkspaceId: response.data.currentMembership?.workspaceId || null
      };
    } catch (error) {
      // If user doesn't exist on backend yet, they are just registered
      return {
        user: { email, role: 'editor', id: uid },
        token,
        activeWorkspaceId: null
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

  async logout() {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Firebase logout failed", e);
      }
    }
    
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors
    }
    return { success: true };
  },

  /**
   * Check pending invitations for the logged-in user
   */
  async checkPendingInvitations() {
    const response = await apiClient.get('/invitations/pending');
    return response.data.invitations || [];
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(token) {
    const response = await apiClient.post('/invitations/accept', { token });
    return response.data;
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(token) {
    const response = await apiClient.post('/invitations/decline', { token });
    return response.data;
  }
};

export default authApi;
