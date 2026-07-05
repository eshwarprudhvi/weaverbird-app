import { workspaceRegistry } from './WorkspaceRegistry';
import { workspaceReadinessManager } from './WorkspaceReadinessManager';
import { workspaceEventBus } from './WorkspaceEventBus';


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

      // 2. Validate workspace if needed (e.g. check permissions/existence)
      // For now, assuming workspaceId is already validated by AuthContext.

      // 3. Reset readiness
      workspaceReadinessManager.reset();

      // 4. Initialize all modules registered in WorkspaceRegistry
      // The registry handles priority sorting internally.
      await workspaceRegistry.initializeAll(workspaceId);

      // 5. Block on Readiness Gates
      // Modules must have called workspaceReadinessManager.markReady() for their respective gates.
      await workspaceReadinessManager.awaitReady();

      // 6. Readiness completed!
      workspaceEventBus.emit('workspace.ready', { workspaceId });

    } catch (error) {
      console.error("WorkspaceBootstrapper: Failed to initialize workspace", error);
      workspaceEventBus.emit('workspace.failed', { workspaceId, error });
      throw error;
    }
  }
}

export const workspaceBootstrapper = new WorkspaceBootstrapper();
