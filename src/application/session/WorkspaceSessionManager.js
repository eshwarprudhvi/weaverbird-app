import { workspaceEventBus } from './WorkspaceEventBus';
import { workspaceCacheManager } from './WorkspaceCacheManager';
import { workspaceListenerManager } from './WorkspaceListenerManager';
import { workspaceBootstrapper } from './WorkspaceBootstrapper';

/**
 * Workspace Session Manager
 * 
 * The single orchestration owner. 
 * Responsibilities: Login, Logout, Offline transition, Create Workspace, Switch Workspace.
 * Keeps strict session locks to prevent concurrent overlaps.
 */
class WorkspaceSessionManager {
  constructor() {
    // IDLE | INITIALIZING | LOADING | READY | SWITCHING | ERROR
    this.sessionState = 'IDLE'; 
    this.activeWorkspaceId = null;
    this.sessionLock = false;
  }

  getState() {
    return this.sessionState;
  }

  getActiveWorkspaceId() {
    return this.activeWorkspaceId;
  }

  /**
   * Safe transition wrapper enforcing the session lock.
   */
  async transitionTo(workspaceId) {
    if (this.sessionLock) {
      console.warn("WorkspaceSessionManager: Transition rejected due to active session lock.");
      return;
    }

    this.sessionLock = true;
    
    // Determine exact state change
    if (this.sessionState === 'READY' || this.sessionState === 'SWITCHING') {
      this.sessionState = 'SWITCHING';
    } else {
      this.sessionState = 'INITIALIZING';
    }

    workspaceEventBus.emit('workspace.switching', { from: this.activeWorkspaceId, to: workspaceId });

    try {
      // 1. Flush Workspace Caches
      await workspaceCacheManager.clearAll();

      // 2. Stop Firestore Listeners
      workspaceListenerManager.stopAll();

      // 3. Update internal tracker
      this.activeWorkspaceId = workspaceId;

      this.sessionState = 'INITIALIZING';
      workspaceEventBus.emit('workspace.initializing', { workspaceId });

      // 4. Bootstrap new workspace
      await workspaceBootstrapper.initialize(workspaceId);
      
      // If we reach here, bootstrap succeeded and 'workspace.ready' was emitted by the bootstrapper.
      this.sessionState = 'READY';

    } catch (error) {
      console.error("WorkspaceSessionManager: Transition failed.", error);
      this.sessionState = 'ERROR';
      workspaceEventBus.emit('workspace.failed', { workspaceId, error });
    } finally {
      this.sessionLock = false;
    }
  }

  /**
   * Resets the entire application (e.g. on full logout)
   */
  async clearSession() {
    await this.transitionTo(null);
  }
}

export const workspaceSessionManager = new WorkspaceSessionManager();
