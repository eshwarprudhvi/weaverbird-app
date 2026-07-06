/**
 * Repository Mutation Lock
 * Prevents duplicate concurrent writes by maintaining an in-flight mutation map keyed by entity ID.
 * Implements Architecture Guardrail Rule 3: Repository Write Lock.
 */
export class MutationLock {
  constructor() {
    this.inFlight = new Map();
  }

  /**
   * Executes a mutation function with entity locking.
   * If an update is currently in-flight for the same entityId with identical payload,
   * the duplicate request is ignored and returns the existing promise.
   * Otherwise, it chains after any existing in-flight mutation to prevent concurrent overlapping writes.
   *
   * @param {string} entityId - Entity identifier to lock on
   * @param {function} mutationFn - Async function performing the repository mutation
   * @param {object} [payload=null] - Optional payload for duplicate detection
   * @returns {Promise<any>}
   */
  async acquire(entityId, mutationFn, payload = null) {
    if (!entityId) return await mutationFn();

    const existing = this.inFlight.get(entityId);
    if (existing) {
      // If payload is identical to the currently running mutation, ignore duplicate request
      if (payload && existing.payload && JSON.stringify(payload) === JSON.stringify(existing.payload)) {
        console.debug(`[MutationLock] Ignoring duplicate concurrent mutation for entityId: ${entityId}`);
        return await existing.promise;
      }
    }

    const previousPromise = existing ? existing.promise : Promise.resolve();

    const nextPromise = previousPromise
      .catch(() => {})
      .then(async () => {
        return await mutationFn();
      })
      .finally(() => {
        const current = this.inFlight.get(entityId);
        if (current && current.promise === nextPromise) {
          this.inFlight.delete(entityId);
        }
      });

    this.inFlight.set(entityId, { promise: nextPromise, payload });
    return await nextPromise;
  }
}
