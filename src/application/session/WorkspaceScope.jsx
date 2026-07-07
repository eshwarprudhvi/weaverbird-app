import React, { createContext, useContext, useEffect, useState } from 'react';
import { workspaceSessionManager } from './WorkspaceSessionManager';
import { workspaceEventBus } from './WorkspaceEventBus';
import { workspaceStorageService } from './WorkspaceStorageService';
import { workspaceCacheManager } from './WorkspaceCacheManager';
import { workspaceListenerManager } from './WorkspaceListenerManager';

export const WorkspaceScopeContext = createContext(null);

/**
 * Workspace Scope Provider
 * 
 * Provides all necessary singletons and context to the React tree.
 * Prevents prop-drilling workspace dependencies.
 */
export const WorkspaceScopeProvider = ({ children }) => {
  const [sessionState, setSessionState] = useState(workspaceSessionManager.getState());
  const [workspaceId, setWorkspaceId] = useState(workspaceSessionManager.getActiveWorkspaceId());

  useEffect(() => {
    const unsubInit = workspaceEventBus.on('workspace.initializing', (payload) => {
      setSessionState('INITIALIZING');
      if (payload && payload.workspaceId !== undefined) {
        setWorkspaceId(payload.workspaceId);
      }
    });

    const unsubReady = workspaceEventBus.on('workspace.ready', (payload) => {
      setSessionState('READY');
      // Also sync workspaceId on ready in case initializing was missed
      if (payload && payload.workspaceId !== undefined) {
        setWorkspaceId(payload.workspaceId);
      }
    });

    const unsubSwitch = workspaceEventBus.on('workspace.switching', () => {
      setSessionState('SWITCHING');
    });

    const unsubFailed = workspaceEventBus.on('workspace.failed', () => {
      setSessionState('ERROR');
    });

    return () => {
      unsubInit();
      unsubReady();
      unsubSwitch();
      unsubFailed();
    };
  }, []);

  const value = {
    workspaceId,
    sessionState,
    
    // Injected Dependencies
    storage: workspaceStorageService,
    cache: workspaceCacheManager,
    listeners: workspaceListenerManager,
    eventBus: workspaceEventBus,
    
    // Future expansion points
    // workspace: { ... },
    // member: { ... },
    // permissions: { ... }
  };

  return (
    <WorkspaceScopeContext.Provider value={value}>
      {children}
    </WorkspaceScopeContext.Provider>
  );
};

export const useWorkspaceScope = () => {
  const context = useContext(WorkspaceScopeContext);
  if (!context) {
    throw new Error('useWorkspaceScope must be used within a WorkspaceScopeProvider');
  }
  return context;
};
