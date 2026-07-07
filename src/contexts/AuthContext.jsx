import React, { createContext, useContext, useState, useEffect } from "react";
import { APPLICATION } from "../config/application";
import authApi from "../api/auth.api";
import { workspaceEventBus } from "../application/session";
import { auth, db, isConfigured } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
    const unsubFailed = workspaceEventBus.on('workspace.failed', async ({ workspaceId, error }) => {
      console.error("Workspace bootstrapper failed, clearing workspace session:", error);
      localStorage.removeItem(APPLICATION.storageKeys.activeWorkspaceId);
      setActiveWorkspaceId(null);

      // Reset the server-side workspaceIndex to prevent boot loops ONLY if the workspace document does not exist.
      // Doing this for transient errors (permissions, network) would incorrectly lock users out of their workspaces.
      const isWorkspaceDeleted = error?.message === 'Workspace document does not exist.' || 
                                 error?.toString().includes('Workspace document does not exist');
      
      if (auth.currentUser && db && isWorkspaceDeleted) {
        try {
          const indexRef = doc(db, 'workspaceIndex', auth.currentUser.uid);
          await setDoc(indexRef, {
            workspaceId: null,
            role: null,
            status: 'inactive',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn("Failed to clear invalid server-side workspaceIndex:", e);
        }
      }
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
      setIsLoading(true);
      try {
        const storedRole = localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
        const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);

        if (firebaseUser) {
          let serverWorkspaceId = null;
          let serverRole = storedRole;
          
          try {
            const indexRef = doc(db, 'workspaceIndex', firebaseUser.uid);
            const indexSnap = await getDoc(indexRef);
            if (indexSnap.exists()) {
              const data = indexSnap.data();
              serverWorkspaceId = data.workspaceId;
              serverRole = data.role || 'member';
            }
          } catch (e) {
            console.warn("Failed to check workspace index:", e);
          }

          const finalWorkspaceId = serverWorkspaceId || storedWorkspace || null;

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
