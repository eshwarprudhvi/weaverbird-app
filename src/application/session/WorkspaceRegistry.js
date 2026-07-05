/**
 * Workspace Registry
 * 
 * Owns module discovery and lifecycle sequencing.
 * Does NOT own orchestration or session state.
 */
class WorkspaceRegistry {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Register a module with the standard contract:
   * { name, priority, initialize, reset, destroy }
   */
  register(moduleConfig) {
    if (!moduleConfig.name || typeof moduleConfig.priority !== 'number') {
      throw new Error(`WorkspaceRegistry: Module must have a 'name' and 'priority'`);
    }
    this.modules.set(moduleConfig.name, moduleConfig);
  }

  unregister(moduleName) {
    this.modules.delete(moduleName);
  }

  getRegisteredModules() {
    // Sort by priority (lower number = higher priority / runs first)
    return Array.from(this.modules.values()).sort((a, b) => a.priority - b.priority);
  }

  async initializeAll(workspaceId) {
    const sortedModules = this.getRegisteredModules();
    for (const mod of sortedModules) {
      if (mod.initialize) {
        try {
          await mod.initialize(workspaceId);
        } catch (error) {
          console.error(`WorkspaceRegistry: Module '${mod.name}' failed to initialize`, error);
          throw error;
        }
      }
    }
  }

  async resetAll() {
    const sortedModules = this.getRegisteredModules();
    for (const mod of sortedModules) {
      if (mod.reset) {
        try {
          await mod.reset();
        } catch (error) {
          console.error(`WorkspaceRegistry: Module '${mod.name}' failed to reset`, error);
        }
      }
    }
  }

  async destroyAll() {
    const sortedModules = this.getRegisteredModules();
    for (const mod of sortedModules) {
      if (mod.destroy) {
        try {
          await mod.destroy();
        } catch (error) {
          console.error(`WorkspaceRegistry: Module '${mod.name}' failed to destroy`, error);
        }
      }
    }
  }
}

export const workspaceRegistry = new WorkspaceRegistry();
