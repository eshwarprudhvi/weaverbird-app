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
        const user = auth.currentUser;

        if (!workspaceId || workspaceId === 'default-workspace') {
          throw new Error(`Invalid workspace ID: ${workspaceId}`);
        }

        if (!user) {
          // No Firebase Auth user — this happens on offline cold starts when the session
          // was restored from localStorage but Firebase couldn't refresh the auth token.
          // Skip Firestore validation and proceed with cached data.
          console.log(`[WorkspaceBootstrapper] No Firebase Auth user (offline session). Skipping Firestore validation for workspace "${workspaceId}".`);
        } else {
          // Online path: validate workspace and member documents via Firestore
          console.log(`[WorkspaceBootstrapper] Checking workspace and member documents concurrently for ID: "${workspaceId}"`);
          const workspaceDocRef = doc(db, 'workspaces', workspaceId);
          const memberDocRef = doc(db, 'workspaces', workspaceId, 'members', user.uid);
          
          // Use a timeout to prevent hanging when network is spotty
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore validation timed out')), 8000)
          );
          
          try {
            const [workspaceSnap, memberSnap] = await Promise.race([
              Promise.all([getDoc(workspaceDocRef), getDoc(memberDocRef)]),
              timeoutPromise
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
          } catch (validationErr) {
            // If validation timed out or failed due to network/offline issues, proceed with cached data
            const errMsg = (validationErr.message || '').toLowerCase();
            const isNetworkError = 
              errMsg.includes('timed out') || 
              errMsg.includes('offline') || 
              errMsg.includes('network') ||
              errMsg.includes('failed to get document') ||
              errMsg.includes('backend') ||
              errMsg.includes('reach');
              
            if (isNetworkError) {
              console.warn(`[WorkspaceBootstrapper] Firestore validation failed due to network/offline (${validationErr.message}) — proceeding with cached data.`);
              workspaceEventBus.emit('workspace.offline', { workspaceId });
            } else {
              throw validationErr; // Re-throw genuine access errors
            }
          }
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

