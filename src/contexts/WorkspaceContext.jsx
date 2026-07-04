import React, { createContext, useContext } from 'react';
import { useWorkspace as useWorkspaceHook } from '../hooks/useWorkspace';

export const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const workspaceData = useWorkspaceHook();

  return (
    <WorkspaceContext.Provider value={workspaceData}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
