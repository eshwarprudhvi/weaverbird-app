/**
 * Workspace Readiness Manager
 * 
 * Owns readiness only.
 * The application becomes READY only after every registered gate reports completion.
 */
class WorkspaceReadinessManager {
  constructor() {
    this.gates = new Map();
    this.resolveReady = null;
    this.promise = null;
  }

  reset() {
    this.gates.clear();
    this.promise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  createGate(name) {
    if (!this.gates.has(name)) {
      this.gates.set(name, false);
    }
  }

  completeGate(name) {
    if (this.gates.has(name)) {
      this.gates.set(name, true);
      this._checkCompletion();
    }
  }

  failGate(name) {
    if (this.gates.has(name)) {
      console.error(`WorkspaceReadinessManager: Gate '${name}' explicitly failed.`);
      // Depending on policy, we might reject the overall promise here.
      // For now, we will log it. The session manager will handle errors if initialization throws.
    }
  }

  _checkCompletion() {
    let allReady = true;
    for (const [name, isReady] of this.gates.entries()) {
      if (!isReady) {
        allReady = false;
        break;
      }
    }
    
    // If there are no gates, or all gates are true, we resolve.
    if (allReady && this.resolveReady) {
      this.resolveReady(true);
    }
  }

  isReady() {
    if (this.gates.size === 0) return true;
    for (const isReady of this.gates.values()) {
      if (!isReady) return false;
    }
    return true;
  }

  async awaitReady() {
    if (this.isReady()) {
      return true;
    }
    if (!this.promise) {
      this.reset();
    }
    return this.promise;
  }
}

export const workspaceReadinessManager = new WorkspaceReadinessManager();
