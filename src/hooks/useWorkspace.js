import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateWorkspaceSettings } from '../api/workspace.api';
import { db } from '../firebase';
import { APPLICATION } from '../config/application';
import { useAuthContext } from '../contexts/AuthContext';

const WORKSPACE_CACHE_KEY = APPLICATION.storageKeys.workspaceCache;

export const useWorkspace = () => {
  const { activeWorkspaceId } = useAuthContext();

  const [workspace, setWorkspace] = useState(() => {
    try {
      const cached = localStorage.getItem(WORKSPACE_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to parse workspace cache", e);
    }
    return null;
  });

  const [status, setStatus] = useState(() => {
    try {
      if (localStorage.getItem(WORKSPACE_CACHE_KEY)) return 'synced';
    } catch (e) {}
    return 'loading';
  });
  const [loading, setLoading] = useState(() => {
    try {
      if (localStorage.getItem(WORKSPACE_CACHE_KEY)) return false;
    } catch (e) {}
    return true;
  });
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setWorkspace(null);
      setStatus('idle');
      setLoading(false);
      return;
    }

    if (!db) {
      console.warn("Firestore db not initialized, relying on local cache.");
      setStatus('offline');
      setLoading(false);
      return;
    }

    setStatus('syncing');
    const docRef = doc(db, 'workspaces', activeWorkspaceId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const mergedData = { id: docSnap.id, ...data };
        setWorkspace(mergedData);
        localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(mergedData));
        setLastSynced(new Date());
        setStatus('synced');
        setError(null);
      } else {
        setWorkspace(null);
        setStatus('error');
        setError(new Error('Workspace does not exist.'));
      }
      setLoading(false);
      setIsDirty(false);
    }, (err) => {
      console.error("Workspace listener error:", err);
      setError(err);
      setStatus('error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeWorkspaceId]);

  const updateWorkspace = async (newProfileData) => {
    try {
      setIsDirty(true);
      const merged = { ...workspace, ...newProfileData };
      
      // Optimistically update local state & cache
      setWorkspace(merged);
      localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(merged));

      if (db && activeWorkspaceId) {
        setStatus('syncing');
        await updateWorkspaceSettings(activeWorkspaceId, merged);
        setStatus('synced');
        setLastSynced(new Date());
      } else {
        setStatus('offline');
      }
    } catch (err) {
      console.error("Failed to update workspace:", err);
      setError(err);
      setStatus('error');
      throw err;
    } finally {
      setIsDirty(false);
    }
  };

  const refreshWorkspace = async () => {
    setIsDirty(false);
  };

  return {
    workspace,
    status,
    loading,
    error,
    lastSynced,
    isDirty,
    updateWorkspace,
    refreshWorkspace
  };
};

