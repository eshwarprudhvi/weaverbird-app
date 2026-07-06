/**
 * Workspace Cache Manager
 * 
 * Owns memory cache cleanup.
 * Executed before every workspace initialization.
 */
class WorkspaceCacheManager {
  constructor() {
    this.cacheClearCallbacks = new Map();
  }

  registerClearCallback(moduleName, callback) {
    this.cacheClearCallbacks.set(moduleName, callback);
  }

  unregisterClearCallback(moduleName) {
    this.cacheClearCallbacks.delete(moduleName);
  }

  async clearAll() {
    for (const [moduleName, callback] of this.cacheClearCallbacks.entries()) {
      try {
        await callback();
      } catch (error) {
        console.error(`WorkspaceCacheManager: Failed to clear cache for module '${moduleName}'`, error);
      }
    }
  }

  // Explicit methods for domain specificity if needed, though usually looping the registry is cleaner.
  // Modules can just bind to reset() in the Registry, but if specific caches need wiping:
  async clearProjects() { await this._invokeIfPresent('projects'); }
  async clearTasks() { await this._invokeIfPresent('tasks'); }
  async clearTodos() { await this._invokeIfPresent('todos'); }
  async clearMeetings() { await this._invokeIfPresent('meetings'); }
  async clearCatalog() { await this._invokeIfPresent('catalog'); }
  async clearDashboard() { await this._invokeIfPresent('dashboard'); }
  async clearNotifications() { await this._invokeIfPresent('notifications'); }
  async clearMembers() { await this._invokeIfPresent('members'); }

  async _invokeIfPresent(moduleName) {
    if (this.cacheClearCallbacks.has(moduleName)) {
      await this.cacheClearCallbacks.get(moduleName)();
    }
  }
}

export const workspaceCacheManager = new WorkspaceCacheManager();
