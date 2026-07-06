import React, { createContext, useContext, useState, useEffect } from "react";
import { APPLICATION } from "../config/application";
import authApi from "../api/auth.api";
import { workspaceEventBus } from "../application/session";
import { auth, isConfigured } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export const WORKSPACE_CONNECTION_STATES = {
  UNCONFIGURED: "UNCONFIGURED",
  OFFLINE: "OFFLINE",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  SYNCING: "SYNCING",
  SYNC_ERROR: "SYNC_ERROR"
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceConnectionState, setWorkspaceConnectionState] = useState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
  const [syncErrorDetails, setSyncErrorDetails] = useState(null);

  // Listen to workspace bootstrapper failures to clear invalid workspace context
  useEffect(() => {
    const unsubFailed = workspaceEventBus.on('workspace.failed', ({ workspaceId, error }) => {
      console.error("Workspace bootstrapper failed, clearing workspace session:", error);
      localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
      setActiveWorkspaceId(null);
    });
    return () => unsubFailed();
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
      try {
        setIsLoading(true);
        const storedRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
        const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);

        if (firebaseUser) {
          try {
            // Retrieve latest session from backend using active Firebase credentials
            const meResult = await authApi.getMe();
            const meData = meResult.data || meResult;
            const serverWorkspaceId = meData.currentMembership?.workspaceId || null;
            const serverRole = meData.currentMembership?.role || storedRole;

            setUser({
              email: firebaseUser.email,
              role: serverRole,
              id: firebaseUser.uid
            });
            setActiveWorkspaceId(serverWorkspaceId);
            setIsLocalMode(false);
            setWorkspaceConnectionState(serverWorkspaceId ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);

            if (serverWorkspaceId) {
              localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, serverWorkspaceId);
            } else {
              localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
            }
            localStorage.setItem(APPLICATION.storageKeys.userRole, serverRole);
            localStorage.setItem(APPLICATION.storageKeys.userEmail, firebaseUser.email);
          } catch (meErr) {
            console.warn("AuthContext: backend session validation failed, using cached session:", meErr);
            setUser({
              email: firebaseUser.email,
              role: storedRole,
              id: firebaseUser.uid
            });
            setActiveWorkspaceId(storedWorkspace || null);
            setIsLocalMode(false);
            setWorkspaceConnectionState(storedWorkspace ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
          }
        } else {
          // No active auth session
          const storedCloudSync = localStorage.getItem(APPLICATION.storageKeys.cloudSync);
          if (storedCloudSync === "false") {
            setIsLocalMode(true);
            setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
          } else {
            setUser(null);
            setActiveWorkspaceId(null);
            setIsLocalMode(false);
            setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
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
