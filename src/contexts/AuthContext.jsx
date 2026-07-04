import React, { createContext, useContext, useState, useEffect } from "react";
import { APPLICATION } from "../config/application";
import authApi from "../api/auth.api";

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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("default-workspace");
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceConnectionState, setWorkspaceConnectionState] = useState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
  const [syncErrorDetails, setSyncErrorDetails] = useState(null);

  // Session Restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        // Check local mode first
        const storedCloudSync = localStorage.getItem(APPLICATION.storageKeys.cloudSync);
        const storedEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
        const storedRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
        const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId) || "default-workspace";

        if (storedEmail) {
          setUser({
            email: storedEmail,
            role: storedRole,
            id: `user-${storedEmail.replace(/[^a-zA-Z0-9]/g, "")}`
          });
          setActiveWorkspaceId(storedWorkspace);
          setIsLocalMode(false);
          setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTED);
        } else if (storedCloudSync === "false") {
          setIsLocalMode(true);
          setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
        } else {
          setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
        }
      } catch (err) {
        console.error("Failed to restore auth session:", err);
        setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
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
