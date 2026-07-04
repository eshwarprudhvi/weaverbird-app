import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { APPLICATION } from '../config/application';

/**
 * Lightweight Offline Write Queue
 * Queues API requests when the device is offline and replays them when online.
 */
class OfflineQueue {
  constructor() {
    this.store = localforage.createInstance({
      name: `${APPLICATION.shortName}_OfflineQueue`,
      storeName: 'api_requests'
    });
    this.isReplaying = false;

    // Listen for online events to automatically trigger replay
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.replayQueue.bind(this));
    }
  }

  /**
   * Enqueues a failed request to be retried later.
   * @param {Object} config - Axios request config
   */
  async enqueue(config) {
    const id = uuidv4();
    // We only store necessary serializable fields from the config
    const requestData = {
      id,
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      timestamp: Date.now()
    };
    
    await this.store.setItem(id, requestData);
    console.log(`[OfflineQueue] Enqueued request: ${config.method.toUpperCase()} ${config.url}`);
    
    // Dispatch an event so the UI can optimistically update
    window.dispatchEvent(new CustomEvent('app:offline-sync-pending', { detail: requestData }));
  }

  /**
   * Replays all queued requests sequentially.
   */
  async replayQueue() {
    if (this.isReplaying || !navigator.onLine) return;
    this.isReplaying = true;

    try {
      const keys = await this.store.keys();
      if (keys.length === 0) {
        this.isReplaying = false;
        return;
      }

      console.log(`[OfflineQueue] Replaying ${keys.length} queued requests...`);

      // We need to require the client dynamically to avoid circular dependencies
      const { default: apiClient } = await import('./client');

      // Sort by timestamp to preserve order of operations
      const requests = [];
      for (const key of keys) {
        const req = await this.store.getItem(key);
        if (req) requests.push(req);
      }
      requests.sort((a, b) => a.timestamp - b.timestamp);

      for (const req of requests) {
        try {
          // Re-attempt the API call
          const res = await apiClient.request({
            url: req.url,
            method: req.method,
            data: req.data,
            headers: req.headers
          });
          // If successful, remove from queue
          await this.store.removeItem(req.id);
          console.log(`[OfflineQueue] Successfully replayed ${req.method.toUpperCase()} ${req.url}`);
          
          window.dispatchEvent(new CustomEvent('app:offline-sync-success', { 
            detail: { 
              tempId: req.data?.id || req.data?.tempId || req.id,
              serverResponse: res,
              originalRequest: req
            } 
          }));
        } catch (error) {
          // If it fails again due to network, stop replaying.
          if (!error.response && error.message !== 'Network Error') {
            // It might be a real network error, pause
            console.warn(`[OfflineQueue] Network still unreachable, pausing replay.`);
            break;
          } else {
            // If it fails due to a server error (4xx, 5xx), drop it and emit failure.
            console.error(`[OfflineQueue] Server rejected queued request, dropping.`, error);
            await this.store.removeItem(req.id);
            window.dispatchEvent(new CustomEvent('app:offline-sync-failed', { 
              detail: { 
                tempId: req.data?.id || req.data?.tempId || req.id,
                error: error,
                originalRequest: req
              } 
            }));
          }
        }
      }
    } catch (err) {
      console.error('[OfflineQueue] Error replaying queue:', err);
    } finally {
      this.isReplaying = false;
      
      const remainingKeys = await this.store.keys();
      if (remainingKeys.length === 0) {
        window.dispatchEvent(new CustomEvent('app:offline-queue-cleared'));
      }
    }
  }
}

export default new OfflineQueue();
