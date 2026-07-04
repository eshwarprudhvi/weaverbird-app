import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const WORKSPACE_CACHE_KEY = 'weaverbird_workspace_cache';
const WORKSPACE_DOC_PATH = 'app/workspace';

const DEFAULT_WORKSPACE = {
  companyName: "My Workspace",
  studioName: "Interior Studio",
  businessCategory: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  gstNumber: "",
  subscription: "pro",
  branding: { logoUrl: "", themePrimary: "" },
  settings: {}
};

export const useWorkspace = () => {
  const [workspace, setWorkspace] = useState(() => {
    try {
      const cached = localStorage.getItem(WORKSPACE_CACHE_KEY);
      if (cached) {
        return { ...DEFAULT_WORKSPACE, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.error("Failed to parse workspace cache", e);
    }
    return DEFAULT_WORKSPACE;
  });

  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!db) {
      console.warn("Firestore db not initialized, relying on local cache.");
      setStatus('offline');
      setLoading(false);
      return;
    }

    setStatus('syncing');
    const docRef = doc(db, WORKSPACE_DOC_PATH);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const mergedData = { ...DEFAULT_WORKSPACE, ...data };
        setWorkspace(mergedData);
        localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(mergedData));
        setLastSynced(new Date());
        setStatus('synced');
        setError(null);
      } else {
        // Document doesn't exist yet, we can create it or just wait for the user to save
        setStatus('synced');
        setLastSynced(new Date());
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
  }, []);

  const updateWorkspace = async (newProfileData) => {
    try {
      setIsDirty(true);
      const merged = { ...workspace, ...newProfileData };
      
      // Optimistically update local state & cache
      setWorkspace(merged);
      localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(merged));

      if (db) {
        setStatus('syncing');
        const docRef = doc(db, WORKSPACE_DOC_PATH);
        await setDoc(docRef, merged, { merge: true });
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
    // onSnapshot handles real-time sync, but providing this for manual triggers if needed
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
