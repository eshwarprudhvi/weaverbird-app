/**
 * Workspace EventBus
 * 
 * Used STRICTLY for notifications and side effects (e.g. Loading Overlays, Analytics).
 * MUST NOT be used for application orchestration or module initialization.
 */
class WorkspaceEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`WorkspaceEventBus: Error in listener for event ${event}`, err);
        }
      });
    }
  }
}

export const workspaceEventBus = new WorkspaceEventBus();
