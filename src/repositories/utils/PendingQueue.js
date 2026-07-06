/**
 * Pending Operation Queue for optimistic updates and automatic rollbacks
 */
class PendingQueue {
  constructor() {
    this.queue = new Map();
  }

  /**
   * Adds an optimistic operation to the queue
   * @param {string} tempId - Temporary ID of the entity
   * @param {function} rollbackFn - Function to revert optimistic changes
   * @param {number} timeoutMs - Max wait time before automatic rollback
   */
  add(tempId, rollbackFn, timeoutMs = 15000) {
    if (this.queue.has(tempId)) {
      this.resolve(tempId);
    }

    const timer = setTimeout(() => {
      console.warn(`[PendingQueue] Timeout reached for tempId: ${tempId}. Triggering rollback...`);
      this.rollback(tempId);
    }, timeoutMs);

    this.queue.set(tempId, { rollbackFn, timer });
  }

  /**
   * Resolves a pending operation (success case, matched by Firestore listener)
   * @param {string} tempId - Temporary ID of the resolved entity
   */
  resolve(tempId) {
    const entry = this.queue.get(tempId);
    if (entry) {
      clearTimeout(entry.timer);
      this.queue.delete(tempId);
      console.log(`[PendingQueue] Successfully reconciled tempId: ${tempId}`);
      return true;
    }
    return false;
  }

  /**
   * Triggers an immediate rollback (API failure case)
   * @param {string} tempId - Temporary ID of the failed entity
   */
  rollback(tempId) {
    const entry = this.queue.get(tempId);
    if (entry) {
      clearTimeout(entry.timer);
      this.queue.delete(tempId);
      try {
        entry.rollbackFn();
      } catch (err) {
        console.error(`[PendingQueue] Error during rollback execution for tempId: ${tempId}:`, err);
      }
      return true;
    }
    return false;
  }

  /**
   * Checks if an ID is currently pending
   */
  isPending(tempId) {
    return this.queue.has(tempId);
  }
}

export const pendingQueue = new PendingQueue();
export default pendingQueue;
