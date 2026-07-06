import { ITaskRepository } from './contracts/ITaskRepository';
import { createTask as createApi, updateTask as updateApi, deleteTask as deleteApi } from '../api/task.api';
import { retryRequest } from './utils/retry';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class RestTaskRepository extends ITaskRepository {
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

        const serverId = result.data.task.id;
        const duration = performance.now() - startTime;
        
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'tasks',
          entityId: serverId
        });

        workspaceEventBus.emit('task.created', buildEvent('task.created', serverId, result.data.task));
        return result.data.task;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'tasks',
          entityId: tempId
        });
        throw err;
      }
    }, data);
  }

  async update(workspaceId, taskId, data) {
    return await this.lock.acquire(taskId, async () => {
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
          return await updateApi(taskId, data);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'tasks',
          entityId: taskId
        });

        workspaceEventBus.emit('task.updated', buildEvent('task.updated', taskId, data));
        return result.data.task;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'tasks',
          entityId: taskId
        });
        throw err;
      }
    }, data);
  }

  async delete(workspaceId, taskId) {
    return await this.lock.acquire(taskId, async () => {
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
          return await deleteApi(taskId);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'tasks',
          entityId: taskId
        });

        workspaceEventBus.emit('task.deleted', buildEvent('task.deleted', taskId, { id: taskId }));
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'tasks',
          entityId: taskId
        });
        throw err;
      }
    }, { action: 'delete' });
  }

  async restore(workspaceId, taskId) {
    return this.update(workspaceId, taskId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    return () => {};
  }

  unsubscribe() {}
}
