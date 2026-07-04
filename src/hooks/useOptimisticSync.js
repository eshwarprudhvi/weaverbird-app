import { useState, useEffect } from 'react';

/**
 * Hook to manage optimistic UI entities for offline sync
 * Listens to offline queue events and manages a local cache of pending mutations.
 */
export const useOptimisticSync = () => {
  const [optimisticProjects, setOptimisticProjects] = useState([]);

  useEffect(() => {
    // When a request is queued offline
    const handlePending = (event) => {
      const req = event.detail;
      // We only care about project creations for now, but this could be expanded
      if (req.url === '/projects' && req.method === 'post') {
        const tempProject = {
          ...req.data,
          id: req.data.id || req.data.tempId, // Ensure we have the temp ID
          syncStatus: 'pending',
          _isOptimistic: true // Flag to know it's a local override
        };
        
        setOptimisticProjects(prev => {
          // Prevent duplicates if multiple events fire
          if (prev.some(p => p.id === tempProject.id)) return prev;
          return [tempProject, ...prev];
        });
      }
      
      if (req.url.startsWith('/projects/') && req.method === 'patch') {
         // Handle optimistic updates to existing projects
         setOptimisticProjects(prev => {
             const existing = prev.find(p => p.id === req.data.id);
             if (existing) {
                 return prev.map(p => p.id === req.data.id ? { ...p, ...req.data, syncStatus: 'pending' } : p);
             }
             return prev;
         });
      }
    };

    // When the queue successfully replays
    const handleSuccess = (event) => {
      const { tempId, serverResponse, originalRequest } = event.detail;
      
      if (originalRequest.url === '/projects' && originalRequest.method === 'post') {
        // The server created it, so Firestore onSnapshot will pick it up.
        // We can safely remove it from our optimistic overlay.
        setOptimisticProjects(prev => prev.filter(p => p.id !== tempId));
      }
    };

    // When the queue permanently fails a request
    const handleFailed = (event) => {
      const { tempId, originalRequest } = event.detail;
      
      if (originalRequest.url === '/projects') {
        // Leave it in the array but mark it as failed so the UI can show a retry button
        setOptimisticProjects(prev => prev.map(p => 
          p.id === tempId ? { ...p, syncStatus: 'failed' } : p
        ));
      }
    };

    window.addEventListener('app:offline-sync-pending', handlePending);
    window.addEventListener('app:offline-sync-success', handleSuccess);
    window.addEventListener('app:offline-sync-failed', handleFailed);

    return () => {
      window.removeEventListener('app:offline-sync-pending', handlePending);
      window.removeEventListener('app:offline-sync-success', handleSuccess);
      window.removeEventListener('app:offline-sync-failed', handleFailed);
    };
  }, []);

  const retrySync = async (tempId, apiFunc, payload) => {
    // Reset status to pending
    setOptimisticProjects(prev => prev.map(p => 
      p.id === tempId ? { ...p, syncStatus: 'pending' } : p
    ));
    
    try {
      // Re-fire the API wrapper call
      // This will either succeed immediately, or go back into the offline queue
      // and trigger app:offline-sync-pending again!
      await apiFunc(payload);
    } catch (err) {
      console.error("Manual retry failed immediately:", err);
      // The offline queue interceptor usually catches it and queues it, 
      // so we might only get here if it's a real 4xx/5xx rejection.
      setOptimisticProjects(prev => prev.map(p => 
        p.id === tempId ? { ...p, syncStatus: 'failed' } : p
      ));
    }
  };

  return {
    optimisticProjects,
    setOptimisticProjects,
    retrySync
  };
};
