import { workspaceRegistry } from './WorkspaceRegistry';
import { workspaceReadinessManager } from './WorkspaceReadinessManager';
import { workspaceEventBus } from './WorkspaceEventBus';
import { workspaceCacheManager } from './WorkspaceCacheManager';
import { workspaceListenerManager } from './WorkspaceListenerManager';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, isConfigured } from '../../firebase';

/**
 * Workspace Bootstrapper
 * 
 * Executes sequential, deterministic initialization steps.
 */
class WorkspaceBootstrapper {
  
  /**
   * Initializes the workspace and blocks until readiness is verified.
   * @param {string|null} workspaceId 
   */
  async initialize(workspaceId) {
    try {
      // 1. Authenticated User & Valid workspaceId validation
      if (isConfigured && auth) {
        // We wait briefly if Auth might not be initialized yet
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found.');
        }

        if (!workspaceId || workspaceId === 'default-workspace') {
          throw new Error(`Invalid workspace ID: ${workspaceId}`);
        }

        console.log(`[WorkspaceBootstrapper] Checking workspace and member documents concurrently for ID: "${workspaceId}"`);
        // 2 & 3. Fetch both workspace and member documents concurrently using standard getDoc (enabling fast cache resolution)
        const workspaceDocRef = doc(db, 'workspaces', workspaceId);
        const memberDocRef = doc(db, 'workspaces', workspaceId, 'members', user.uid);
        
        const [workspaceSnap, memberSnap] = await Promise.all([
          getDoc(workspaceDocRef),
          getDoc(memberDocRef)
        ]);

        console.log(`[WorkspaceBootstrapper] Workspace exists in DB: ${workspaceSnap.exists()}`);
        if (!workspaceSnap.exists()) {
          throw new Error('Workspace document does not exist.');
        }

        if (!memberSnap.exists()) {
          throw new Error('Member document does not exist in this workspace.');
        }

        const memberData = memberSnap.data();
        if (memberData.status !== 'active') {
          throw new Error(`Member is not active in this workspace (Status: ${memberData.status || 'unknown'}).`);
        }
      } else {
        // Simulated/Local mode checks
        if (!workspaceId || workspaceId === 'default-workspace') {
          throw new Error(`Invalid workspace ID in local mode: ${workspaceId}`);
        }
      }

      // 4. Reset readiness
      workspaceReadinessManager.reset();

      // 5. Initialize all modules registered in WorkspaceRegistry
      // The registry handles priority sorting internally.
      await workspaceRegistry.initializeAll(workspaceId);

      // 6. Block on Readiness Gates
      // Modules must have called workspaceReadinessManager.markReady() for their respective gates.
      await workspaceReadinessManager.awaitReady();

      // 7. Readiness completed!
      workspaceEventBus.emit('workspace.ready', { workspaceId });

    } catch (error) {
      console.error("WorkspaceBootstrapper: Failed to initialize workspace", error);
      
      // Stop all active Firestore listeners
      workspaceListenerManager.stopAll();
      
      // Clear all workspace caches
      await workspaceCacheManager.clearAll();
      
      workspaceEventBus.emit('workspace.failed', { workspaceId, error });
      throw error;
    }
  }
}

export const workspaceBootstrapper = new WorkspaceBootstrapper();

