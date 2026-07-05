import React, { useState } from 'react';
import { useWorkspaceScope } from './WorkspaceScope';
import { workspaceRegistry } from './WorkspaceRegistry';
import { workspaceReadinessManager } from './WorkspaceReadinessManager';

/**
 * Workspace Diagnostics (Development Only)
 * 
 * Displays internal session state to help debug isolation and lifecycle issues.
 * Should NOT be included in production builds.
 */
export const WorkspaceDiagnostics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const scope = useWorkspaceScope();

  // In a real dev-only panel, you might want this omitted completely using Vite's import.meta.env.PROD.
  // We'll leave the logic here and assume the parent decides whether to render it.

  if (!isOpen) {
    return (
      <div 
        style={{ position: 'fixed', bottom: 10, right: 10, background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', zIndex: 9999, fontSize: '12px' }}
        onClick={() => setIsOpen(true)}
      >
        Session Info ({scope.sessionState})
      </div>
    );
  }

  const modules = workspaceRegistry.getRegisteredModules();
  
  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, background: '#111', color: '#0f0', padding: '16px', borderRadius: '8px', zIndex: 9999, maxWidth: '400px', fontSize: '12px', fontFamily: 'monospace', overflowY: 'auto', maxHeight: '80vh', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <strong>Workspace Diagnostics</strong>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: '#f00', border: 'none', cursor: 'pointer' }}>Close</button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Active Workspace:</strong> {scope.workspaceId || 'offline (null)'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Session State:</strong> {scope.sessionState}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Registered Modules ({modules.length}):</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
          {modules.map(m => (
            <li key={m.name}>{m.name} (Priority: {m.priority})</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Readiness Gates:</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
          {Array.from(workspaceReadinessManager.gates.entries()).map(([name, isReady]) => (
            <li key={name} style={{ color: isReady ? '#0f0' : '#f00' }}>
              {name}: {isReady ? 'READY' : 'PENDING'}
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <strong>Active Listeners:</strong> {scope.listeners.listeners.size} module(s) tracked.
      </div>
    </div>
  );
};
