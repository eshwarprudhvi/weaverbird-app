import { ICatalogRepository } from './contracts/ICatalogRepository';
import { createCatalogItem as createApi, updateCatalogItem as updateApi, deleteCatalogItem as deleteApi } from '../api/catalog.api';
import { retryRequest } from './utils/retry';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class RestCatalogRepository extends ICatalogRepository {
  constructor() {
    super();
    this.lock = new MutationLock();
  }

  async create(workspaceId, data) {
    const tempId = data.id || data.tempId || `temp_${Date.now()}`;
    return await this.lock.acquire(tempId, async () => {
      const startTime = performance.now();
      
      const buildEvent = (type, entityId, payload) => ({
        type,
        workspaceId,
        entityId,
        timestamp: new Date().toISOString(),
        payload
      });

      try {
        const result = await retryRequest(async () => {
          return await createApi({ ...data, tempId });
        });

        const serverId = result.data.item.id;
        const duration = performance.now() - startTime;
        
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'catalog',
          entityId: serverId
        });

        workspaceEventBus.emit('catalogItem.created', buildEvent('catalogItem.created', serverId, result.data.item));
        return result.data.item;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'catalog',
          entityId: tempId
        });
        throw err;
      }
    }, data);
  }

  async update(workspaceId, itemId, data) {
    return await this.lock.acquire(itemId, async () => {
      const startTime = performance.now();

      const buildEvent = (type, entityId, payload) => ({
        type,
        workspaceId,
        entityId,
        timestamp: new Date().toISOString(),
        payload
      });

      try {
        const result = await retryRequest(async () => {
          return await updateApi(itemId, data);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'catalog',
          entityId: itemId
        });

        workspaceEventBus.emit('catalogItem.updated', buildEvent('catalogItem.updated', itemId, data));
        return result.data.item;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'catalog',
          entityId: itemId
        });
        throw err;
      }
    }, data);
  }

  async delete(workspaceId, itemId) {
    return await this.lock.acquire(itemId, async () => {
      const startTime = performance.now();

      const buildEvent = (type, entityId, payload) => ({
        type,
        workspaceId,
        entityId,
        timestamp: new Date().toISOString(),
        payload
      });

      try {
        await retryRequest(async () => {
          return await deleteApi(itemId);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'catalog',
          entityId: itemId
        });

        workspaceEventBus.emit('catalogItem.deleted', buildEvent('catalogItem.deleted', itemId, { id: itemId }));
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'catalog',
          entityId: itemId
        });
        throw err;
      }
    }, { action: 'delete' });
  }

  async restore(workspaceId, itemId) {
    return this.update(workspaceId, itemId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    return () => {};
  }

  unsubscribe() {}
}
