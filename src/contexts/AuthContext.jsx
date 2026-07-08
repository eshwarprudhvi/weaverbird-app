import React, { createContext, useContext, useState, useEffect } from "react";
import { APPLICATION } from "../config/application";
import { Capacitor } from "@capacitor/core";
import authApi from "../api/auth.api";
import { workspaceEventBus } from "../application/session";
import { auth, db, isConfigured } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export const WORKSPACE_CONNECTION_STATES = {
  UNCONFIGURED: "UNCONFIGURED",
  OFFLINE: "OFFLINE",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  SYNCING: "SYNCING",
  SYNC_ERROR: "SYNC_ERROR"
};

export const failedWorkspaceIds = new Set();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceConnectionState, setWorkspaceConnectionState] = useState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const [syncErrorDetails, setSyncErrorDetails] = useState(null);

  // Listen to workspace bootstrapper events and dynamic network changes
  useEffect(() => {
    const unsubFailed = workspaceEventBus.on('workspace.failed', async ({ workspaceId, error }) => {
      console.error("Workspace bootstrapper failed:", error);

      // Distinguish genuine access errors from transient network/offline failures.
      // Genuine errors: workspace deleted, member removed, member inactive.
      // Transient errors: network timeout, offline, Firebase unavailable.
      const errorMsg = (error?.message || '').toLowerCase();
      const isGenuineAccessError = 
        errorMsg.includes('does not exist') || 
        errorMsg.includes('not active') ||
        errorMsg.includes('invalid workspace');

      if (isGenuineAccessError) {
        console.warn("[AuthContext] Genuine access error — clearing workspace session.");
        if (workspaceId) failedWorkspaceIds.add(workspaceId);
        localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
        setActiveWorkspaceId(null);
      } else {
        console.warn("[AuthContext] Transient failure — preserving stored workspace session.");
      }
    });

    const unsubOffline = workspaceEventBus.on('workspace.offline', () => {
      console.warn("[AuthContext] Workspace backend is unreachable — setting connection state to OFFLINE.");
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
    });

    // Dynamic browser/native network events to immediately update UI badge when internet drops/returns
    const handleOffline = () => {
      console.log("[AuthContext] Network connection lost — setting state to OFFLINE.");
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
      setIsNetworkOnline(false);
    };

    const handleOnline = () => {
      console.log("[AuthContext] Network connection restored.");
      // Only set to CONNECTED if we have an active workspace selected and we aren't in local mode
      setWorkspaceConnectionState(prev => 
        prev === WORKSPACE_CONNECTION_STATES.OFFLINE ? WORKSPACE_CONNECTION_STATES.CONNECTED : prev
      );
      setIsNetworkOnline(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Also support Capacitor Network listener for native devices/emulators
    let capacitorListener = null;
    let isUnmounted = false;
    
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/network').then(({ Network }) => {
        if (isUnmounted) return;
        Network.getStatus().then(status => {
          if (!isUnmounted) {
            setIsNetworkOnline(status.connected);
            if (!status.connected) {
              setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
            }
          }
        }).catch(() => {});

        Network.addListener('networkStatusChange', (status) => {
          if (status.connected) {
            handleOnline();
          } else {
            handleOffline();
          }
        }).then(listener => {
          if (isUnmounted) {
            listener.remove();
          } else {
            capacitorListener = listener;
          }
        });
      }).catch(() => {});
    }

    return () => {
      isUnmounted = true;
      unsubFailed();
      unsubOffline();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (capacitorListener) {
        capacitorListener.remove();
      }
    };
  }, []);

  // Session Restoration on mount using Firebase onAuthStateChanged
  useEffect(() => {
    if (!isConfigured || !auth) {
      // Local/Simulated mode: check localStorage immediately
      const storedCloudSync = localStorage.getItem(APPLICATION.storageKeys.cloudSync);
      const storedEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
      const storedRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
      const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);

      if (storedEmail) {
        setUser({
          email: storedEmail,
          role: storedRole,
          id: `user-${storedEmail.replace(/[^a-zA-Z0-9]/g, "")}`
        });
        setActiveWorkspaceId(storedWorkspace || null);
        setIsLocalMode(false);
        setWorkspaceConnectionState(storedWorkspace ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      } else if (storedCloudSync === "false") {
        setIsLocalMode(true);
        setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
      } else {
        setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        const storedRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
        const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);

        if (firebaseUser) {
          const validStored = storedWorkspace && !failedWorkspaceIds.has(storedWorkspace) ? storedWorkspace : null;
          let serverWorkspaceId = null;
          let serverRole = storedRole;
          
          if (!validStored) {
            try {
              const indexRef = doc(db, 'workspaceIndex', firebaseUser.uid);
              const indexSnap = await getDoc(indexRef);
              if (indexSnap.exists()) {
                const data = indexSnap.data();
                if (data.workspaceId && !failedWorkspaceIds.has(data.workspaceId)) {
                  serverWorkspaceId = data.workspaceId;
                  serverRole = data.role || 'member';
                }
              }
            } catch (e) {
              console.warn("Failed to check workspace index:", e);
            }
          } else {
            // Asynchronously verify index in background without blocking startup
            doc(db, 'workspaceIndex', firebaseUser.uid);
            getDoc(doc(db, 'workspaceIndex', firebaseUser.uid)).then(indexSnap => {
              if (indexSnap.exists()) {
                const data = indexSnap.data();
                if (data.role && data.role !== storedRole) {
                  localStorage.setItem(APPLICATION.storageKeys.userRole, data.role);
                }
              }
            }).catch(() => {});
          }

          const finalWorkspaceId = validStored || serverWorkspaceId || null;

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: serverRole
          });
          setIsLocalMode(false);
          setActiveWorkspaceId(finalWorkspaceId);
          setWorkspaceConnectionState(finalWorkspaceId ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);

          if (finalWorkspaceId) {
            localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, finalWorkspaceId);
            localStorage.setItem(APPLICATION.storageKeys.userRole, serverRole);
          } else {
            localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
          }
          localStorage.setItem(APPLICATION.storageKeys.userEmail, firebaseUser.email);
        } else {
          const storedCloudSync = localStorage.getItem(APPLICATION.storageKeys.cloudSync);
          if (storedCloudSync === "false") {
            setIsLocalMode(true);
            setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
          } else {
            // Firebase Auth returned null user. This can happen when:
            // 1. The device is offline and Auth can't refresh the token
            // 2. The user genuinely logged out (but logout clears localStorage)
            // 3. First-time user (localStorage is empty)
            //
            // If localStorage still has stored credentials, this is NOT a logout
            // or first-time user — it's an offline/auth-refresh-failure cold start.
            // Restore the previous session from cache.
            const storedEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
            const storedWorkspaceId = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);

            if (storedEmail && storedWorkspaceId) {
              console.log("[AuthContext] Firebase Auth returned null but stored session exists — restoring from cache:", storedEmail);
              const offlineRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
              setUser({
                email: storedEmail,
                role: offlineRole,
                id: `user-${storedEmail.replace(/[^a-zA-Z0-9]/g, "")}`,
                _offlineRestored: true
              });
              setActiveWorkspaceId(storedWorkspaceId);
              setIsLocalMode(false);
              setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
            } else {
              // Genuine unauthenticated state (first-time user or logged out)
              setUser(null);
              setActiveWorkspaceId(null);
              setIsLocalMode(false);
              setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore auth session:", err);
        setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const switchWorkspace = async (workspaceId) => {
    setIsLoading(true);
    try {
      let role = 'member';
      if (!isLocalMode && db && auth.currentUser) {
        const memberRef = doc(db, 'workspaces', workspaceId, 'members', auth.currentUser.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          role = memberSnap.data().role || 'member';
        }
        
        const indexRef = doc(db, 'workspaceIndex', auth.currentUser.uid);
        await setDoc(indexRef, {
          workspaceId: workspaceId,
          role: role,
          status: 'active',
          updatedAt: serverTimestamp()
        });
      }
      
      setActiveWorkspaceId(workspaceId);
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTED);
      localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, workspaceId);
      localStorage.setItem(APPLICATION.storageKeys.userRole, role);
      
      // Emit connection change event so session manager resets correctly
      if (workspaceEventBus) {
        workspaceEventBus.emit('workspace.connection_changed', { workspaceId });
      }
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      alert("Failed to switch workspace: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    isLocalMode,
    setIsLocalMode,
    activeWorkspaceId,
    setActiveWorkspaceId,
    isLoading,
    setIsLoading,
    workspaceConnectionState,
    setWorkspaceConnectionState,
    syncErrorDetails,
    setSyncErrorDetails,
    isAuthenticated: !!user,
    switchWorkspace,
    isNetworkOnline,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;


