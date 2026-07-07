import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import invitationRepository from '../repositories/InvitationRepository';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, db, isConfigured } from '../firebase';

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

import { RepositoryFactory } from '../repositories/RepositoryFactory';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

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
    
    if (RepositoryFactory.isFirebaseMode()) {
      try {
        const indexDoc = await getDoc(doc(db, 'workspaceIndex', uid));
        if (indexDoc.exists()) {
          const indexData = indexDoc.data();
          return {
            user: {
              email: auth.currentUser?.email || email,
              role: indexData.role || 'editor',
              id: uid
            },
            token,
            activeWorkspaceId: indexData.workspaceId
          };
        }
      } catch (e) {
        console.error("Firestore session load failed:", e);
      }
      return {
        user: { email, role: 'editor', id: uid },
        token,
        activeWorkspaceId: null
      };
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
      activeWorkspaceId: null
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
        if (Capacitor.isNativePlatform()) {
          let result;
          try {
            // Bypass Credential Manager API (which throws "No credentials available" on debug APKs or first sign-in)
            // and use the classic Google Account Picker popup!
            result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false });
          } catch (nativeErr) {
            console.warn("Classic Account Picker failed, retrying with Credential Manager:", nativeErr);
            result = await FirebaseAuthentication.signInWithGoogle();
          }
          const credential = GoogleAuthProvider.credential(result.credential?.idToken);
          userCredential = await signInWithCredential(auth, credential);
        } else {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({
            prompt: 'select_account'
          });
          userCredential = await signInWithPopup(auth, provider);
        }
      } catch (firebaseError) {
        throw new Error(mapFirebaseError(firebaseError));
      }
      email = userCredential.user.email;
      token = await userCredential.user.getIdToken();
      uid = userCredential.user.uid;
    }
    
    if (RepositoryFactory.isFirebaseMode()) {
      try {
        const indexDoc = await getDoc(doc(db, 'workspaceIndex', uid));
        if (indexDoc.exists()) {
          const indexData = indexDoc.data();
          return {
            user: {
              email: auth.currentUser?.email || email,
              role: indexData.role || 'editor',
              id: uid
            },
            token,
            activeWorkspaceId: indexData.workspaceId
          };
        }
      } catch (e) {
        console.error("Firestore session load failed:", e);
      }
      return {
        user: { email, role: 'editor', id: uid },
        token,
        activeWorkspaceId: null
      };
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
      return {
        user: { email, role: 'editor', id: uid },
        token,
        activeWorkspaceId: null
      };
    }
  },

  /**
   * Register a new workspace
   */
  async registerWorkspace(workspaceData) {
    if (RepositoryFactory.isFirebaseMode()) {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Authentication required");
      
      // Idempotency check: Return existing active workspace if already registered
      const indexRef = doc(db, 'workspaceIndex', userId);
      const indexSnap = await getDoc(indexRef);
      if (indexSnap.exists()) {
        const indexData = indexSnap.data();
        if (indexData.status === 'active' && indexData.workspaceId) {
          const wsSnap = await getDoc(doc(db, 'workspaces', indexData.workspaceId));
          if (wsSnap.exists()) {
            return {
              success: true,
              workspace: { id: indexData.workspaceId, name: wsSnap.data().companyName }
            };
          }
        }
      }
      
      const workspaceId = `ws_${Date.now()}`;
      const batch = writeBatch(db);
      
      // 1. Create workspace document
      const wsRef = doc(db, 'workspaces', workspaceId);
      batch.set(wsRef, {
        companyName: workspaceData.companyName || workspaceData.studioName || 'My Workspace',
        country: workspaceData.country || 'India',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1
      });

      // 2. Add owner to workspace members subcollection
      const memberRef = doc(db, 'workspaces', workspaceId, 'members', userId);
      batch.set(memberRef, {
        email: auth.currentUser.email,
        name: workspaceData.ownerName || auth.currentUser.displayName || 'Owner',
        role: 'owner',
        status: 'active',
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1
      });

      // 3. Create workspace index
      batch.set(indexRef, {
        workspaceId,
        role: 'owner',
        status: 'active',
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      return {
        success: true,
        workspace: { id: workspaceId, name: workspaceData.companyName }
      };
    }

    const response = await apiClient.post('/auth/register-workspace', workspaceData);
    return response.data;
  },

  /**
   * Join workspace
   */
  async joinWorkspace(joinData) {
    if (RepositoryFactory.isFirebaseMode()) {
      throw new Error("Join workspace requires invitation link acceptance in serverless mode");
    }
    const response = await apiClient.post('/auth/join-workspace', joinData);
    return response.data;
  },

  /**
   * Verify session
   */
  async getMe() {
    if (RepositoryFactory.isFirebaseMode()) {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const docSnap = await getDoc(doc(db, 'workspaceIndex', userId));
        if (docSnap.exists()) {
          const data = docSnap.doc ? docSnap.data() : docSnap.data();
          return {
            user: { email: auth.currentUser.email, uid: userId },
            currentMembership: {
              workspaceId: data.workspaceId,
              role: data.role
            }
          };
        }
      }
      return { user: null, currentMembership: null };
    }
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
    
    if (!RepositoryFactory.isFirebaseMode()) {
      try {
        await apiClient.post('/auth/logout');
      } catch (e) {
        // Ignore network errors
      }
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
