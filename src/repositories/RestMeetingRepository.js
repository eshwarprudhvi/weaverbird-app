import { IMeetingRepository } from './contracts/IMeetingRepository';
import { createMeeting as createApi, updateMeeting as updateApi, deleteMeeting as deleteApi } from '../api/meeting.api';
import { retryRequest } from './utils/retry';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class RestMeetingRepository extends IMeetingRepository {
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

        const serverId = result.data.meeting.id;
        const duration = performance.now() - startTime;
        
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'meetings',
          entityId: serverId
        });

        workspaceEventBus.emit('meeting.created', buildEvent('meeting.created', serverId, result.data.meeting));
        return result.data.meeting;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'meetings',
          entityId: tempId
        });
        throw err;
      }
    }, data);
  }

  async update(workspaceId, meetingId, data) {
    return await this.lock.acquire(meetingId, async () => {
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
          return await updateApi(meetingId, data);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'meetings',
          entityId: meetingId
        });

        workspaceEventBus.emit('meeting.updated', buildEvent('meeting.updated', meetingId, data));
        return result.data.meeting;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'update',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'meetings',
          entityId: meetingId
        });
        throw err;
      }
    }, data);
  }

  async delete(workspaceId, meetingId) {
    return await this.lock.acquire(meetingId, async () => {
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
          return await deleteApi(meetingId);
        });

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'meetings',
          entityId: meetingId
        });

        workspaceEventBus.emit('meeting.deleted', buildEvent('meeting.deleted', meetingId, { id: meetingId }));
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'delete',
          duration,
          retryCount: 0,
          success: false,
          failure: err,
          workspaceId,
          entityType: 'meetings',
          entityId: meetingId
        });
        throw err;
      }
    }, { action: 'delete' });
  }

  async restore(workspaceId, meetingId) {
    return this.update(workspaceId, meetingId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    return () => {};
  }

  unsubscribe() {}
}
