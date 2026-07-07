import { useCallback } from "react";
import { useAuthContext, WORKSPACE_CONNECTION_STATES } from "../contexts/AuthContext";
import authApi from "../api/auth.api";
import { APPLICATION } from "../config/application";

export const useAuth = () => {
  const {
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
    isAuthenticated,
    switchWorkspace,
  } = useAuthContext();

  /**
   * Log into workspace using credentials
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTING);
    try {
      const session = await authApi.login(credentials);
      setUser(session.user);
      setActiveWorkspaceId(session.activeWorkspaceId || null);
      setIsLocalMode(false);
      setWorkspaceConnectionState(session.activeWorkspaceId ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      setSyncErrorDetails(null);

      // Persist to storage using APPLICATION keys
      localStorage.setItem(APPLICATION.storageKeys.userEmail, session.user.email);
      localStorage.setItem(APPLICATION.storageKeys.userRole, session.user.role);
      localStorage.setItem(APPLICATION.storageKeys.cloudSync, "true");
      if (session.activeWorkspaceId) {
        localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, session.activeWorkspaceId);
      }
      return session;
    } catch (err) {
      setWorkspaceConnectionState(
        isLocalMode ? WORKSPACE_CONNECTION_STATES.OFFLINE : WORKSPACE_CONNECTION_STATES.UNCONFIGURED
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setActiveWorkspaceId, setIsLocalMode, setIsLoading, setWorkspaceConnectionState, isLocalMode, setSyncErrorDetails]);

  /**
   * Log out of current session
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setIsLocalMode(false);
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      setSyncErrorDetails(null);
      localStorage.removeItem(APPLICATION.storageKeys.userEmail);
      localStorage.removeItem(APPLICATION.storageKeys.userRole);
      localStorage.removeItem(APPLICATION.storageKeys.cloudSync);
      localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLocalMode, setIsLoading, setWorkspaceConnectionState, setSyncErrorDetails]);

  /**
   * Register with email/password
   */
  const register = useCallback(async (credentials) => {
    setIsLoading(true);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTING);
    try {
      const session = await authApi.register(credentials);
      setUser(session.user);
      setActiveWorkspaceId(null);
      setIsLocalMode(false);
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      setSyncErrorDetails(null);

      localStorage.setItem(APPLICATION.storageKeys.userEmail, session.user.email);
      localStorage.setItem(APPLICATION.storageKeys.userRole, session.user.role);
      localStorage.setItem(APPLICATION.storageKeys.cloudSync, "true");
      return session;
    } catch (err) {
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setActiveWorkspaceId, setIsLocalMode, setIsLoading, setWorkspaceConnectionState, setSyncErrorDetails]);

  /**
   * Login with Google Auth Provider
   */
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTING);
    try {
      const session = await authApi.loginWithGoogle();
      setUser(session.user);
      setActiveWorkspaceId(session.activeWorkspaceId || null);
      setIsLocalMode(false);
      setWorkspaceConnectionState(session.activeWorkspaceId ? WORKSPACE_CONNECTION_STATES.CONNECTED : WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      setSyncErrorDetails(null);

      localStorage.setItem(APPLICATION.storageKeys.userEmail, session.user.email);
      localStorage.setItem(APPLICATION.storageKeys.userRole, session.user.role);
      localStorage.setItem(APPLICATION.storageKeys.cloudSync, "true");
      if (session.activeWorkspaceId) {
        localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, session.activeWorkspaceId);
      }
      return session;
    } catch (err) {
      setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setActiveWorkspaceId, setIsLocalMode, setIsLoading, setWorkspaceConnectionState, setSyncErrorDetails]);

  /**
   * Register a new workspace
   */
  const registerWorkspace = useCallback(async (workspaceData) => {
    if (!APPLICATION.features.selfRegistration) {
      return { status: "coming_soon" };
    }
    setIsLoading(true);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTING);
    try {
      const result = await authApi.registerWorkspace(workspaceData);
      if (result && result.user) {
        setUser(result.user);
        setIsLocalMode(false);
        setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.CONNECTED);
        setSyncErrorDetails(null);
        localStorage.setItem(APPLICATION.storageKeys.userEmail, result.user.email);
        localStorage.setItem(APPLICATION.storageKeys.userRole, result.user.role || "owner");
        localStorage.setItem(APPLICATION.storageKeys.cloudSync, "true");
        
        if (result.activeWorkspaceId) {
          setActiveWorkspaceId(result.activeWorkspaceId);
          localStorage.setItem(APPLICATION.storageKeys.activeWorkspaceId, result.activeWorkspaceId);
        }
      }
      return result;
    } catch (err) {
      setWorkspaceConnectionState(
        isLocalMode ? WORKSPACE_CONNECTION_STATES.OFFLINE : WORKSPACE_CONNECTION_STATES.UNCONFIGURED
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLocalMode, setIsLoading, setWorkspaceConnectionState, isLocalMode, setSyncErrorDetails]);



  /**
   * Continue Offline (Local Projects Only)
   */
  const continueOffline = useCallback(() => {
    setUser(null);
    setIsLocalMode(true);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.OFFLINE);
    setSyncErrorDetails(null);
    localStorage.setItem(APPLICATION.storageKeys.cloudSync, "false");
    localStorage.removeItem(APPLICATION.storageKeys.userEmail);
  }, [setUser, setIsLocalMode, setWorkspaceConnectionState, setSyncErrorDetails]);

  const connectFromOffline = useCallback(async () => {
    setIsLocalMode(false);
    setWorkspaceConnectionState(WORKSPACE_CONNECTION_STATES.UNCONFIGURED);
    localStorage.removeItem(APPLICATION.storageKeys.cloudSync);
  }, [setIsLocalMode, setWorkspaceConnectionState]);

  const restoreSession = useCallback(async () => {
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
  }, [setUser, setIsLocalMode, setWorkspaceConnectionState, setActiveWorkspaceId]);

  return {
    user,
    isAuthenticated,
    isLocalMode,
    isLoading,
    activeWorkspaceId,
    workspaceConnectionState,
    syncErrorDetails,
    login,
    register,
    loginWithGoogle,
    logout,
    registerWorkspace,
    continueOffline,
    connectFromOffline,
    restoreSession,
    switchWorkspace,
    checkPendingInvitations: authApi.checkPendingInvitations,
    acceptInvitation: authApi.acceptInvitation,
    declineInvitation: authApi.declineInvitation,
  };
};

export default useAuth;
