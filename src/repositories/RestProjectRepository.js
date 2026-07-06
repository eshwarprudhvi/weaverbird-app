import { IProjectRepository } from './contracts/IProjectRepository';
import { createProject as createApi, updateProject as updateApi, deleteProject as deleteApi } from '../api/project.api';
import { retryRequest } from './utils/retry';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class RestProjectRepository extends IProjectRepository {
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

        const serverId = result.data.project.id;
        const duration = performance.now() - startTime;
        
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'projects',
          entityId: serverId
        });

        workspaceEventBus.emit('project.created', buildEvent('project.created', serverId, result.data.project));
        return result.data.project;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'projects',
          entityId: tempId
        });
        throw err;
      }
    }, data);
  }

  async update(workspaceId, projectId, data) {
    return await this.lock.acquire(projectId, async () => {
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
          return await updateApi(projectId, data);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'projects',
          entityId: projectId
        });

        workspaceEventBus.emit('project.updated', buildEvent('project.updated', projectId, data));
        return result.data.project;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'projects',
          entityId: projectId
        });
        throw err;
      }
    }, data);
  }

  async delete(workspaceId, projectId) {
    return await this.lock.acquire(projectId, async () => {
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
          return await deleteApi(projectId);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'projects',
          entityId: projectId
        });

        workspaceEventBus.emit('project.deleted', buildEvent('project.deleted', projectId, { id: projectId }));
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'projects',
          entityId: projectId
        });
        throw err;
      }
    }, { action: 'delete' });
  }

  async restore(workspaceId, projectId) {
    // REST API does not support raw restore natively without PATCH update
    return this.update(workspaceId, projectId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    // Realtime subscriptions not supported in standard REST API mode
    return () => {};
  }

  unsubscribe() {}
}
