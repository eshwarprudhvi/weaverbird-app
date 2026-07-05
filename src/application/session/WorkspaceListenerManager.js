/**
 * Workspace Listener Manager
 * 
 * Owns Firestore listeners exclusively.
 * No hook or component may call `onSnapshot()` directly.
 */
class WorkspaceListenerManager {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Registers a listener and keeps track of its unsubscribe function.
   * @param {string} moduleName - e.g., 'projects', 'tasks'
   * @param {string} listenerId - A unique ID for the specific listener (e.g., 'projects-list')
   * @param {Function} unsubscribeFn - The function returned by Firebase onSnapshot
   */
  register(moduleName, listenerId, unsubscribeFn) {
    if (!this.listeners.has(moduleName)) {
      this.listeners.set(moduleName, new Map());
    }
    
    const moduleListeners = this.listeners.get(moduleName);
    
    // If there's an existing listener with this ID, stop it first to prevent duplicates
    if (moduleListeners.has(listenerId)) {
      this.unregister(moduleName, listenerId);
    }
    
    moduleListeners.set(listenerId, unsubscribeFn);
  }

  /**
   * Unregisters and stops a specific listener.
   */
  unregister(moduleName, listenerId) {
    const moduleListeners = this.listeners.get(moduleName);
    if (moduleListeners && moduleListeners.has(listenerId)) {
      const unsubscribeFn = moduleListeners.get(listenerId);
      try {
        unsubscribeFn(); // Actually unsubscribe from Firebase
      } catch (err) {
        console.error(`WorkspaceListenerManager: Failed to unsubscribe ${moduleName}/${listenerId}`, err);
      }
      moduleListeners.delete(listenerId);
    }
  }

  /**
   * Stops all listeners for all modules.
   * Executed during workspace transitions to ensure 0 orphans.
   */
  stopAll() {
    for (const [moduleName, moduleListeners] of this.listeners.entries()) {
      for (const [listenerId, unsubscribeFn] of moduleListeners.entries()) {
        try {
          unsubscribeFn();
        } catch (err) {
          console.error(`WorkspaceListenerManager: Failed to unsubscribe ${moduleName}/${listenerId}`, err);
        }
      }
      moduleListeners.clear();
    }
    this.listeners.clear();
  }
}

export const workspaceListenerManager = new WorkspaceListenerManager();
