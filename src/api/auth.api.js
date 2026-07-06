import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import invitationRepository from '../repositories/InvitationRepository';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, isConfigured } from '../firebase';

/**
 * Map Firebase auth error codes to user-friendly messages
 */
function mapFirebaseError(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please create an account first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. If you signed up with Google, use "Continue with Google" or set a password from your Account page.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your admin.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Multiple sign-in popups were opened. Please use the active one.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export const authApi = {
  /**
   * Login with email/password
   */
  async login(credentials) {
    const { email, password } = credentials;
    let userCredential;
    
    if (isConfigured && auth) {
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        throw new Error(mapFirebaseError(firebaseError));
      }
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
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        throw new Error(mapFirebaseError(firebaseError));
      }
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
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        userCredential = await signInWithPopup(auth, provider);
      } catch (firebaseError) {
        throw new Error(mapFirebaseError(firebaseError));
      }
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
    return await invitationRepository.listMy();
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(token) {
    return await invitationRepository.accept(token);
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(token) {
    return await invitationRepository.decline(token);
  }
};

export default authApi;
