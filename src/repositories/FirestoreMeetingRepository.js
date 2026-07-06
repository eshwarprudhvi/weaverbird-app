import { doc, setDoc, updateDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { IMeetingRepository } from './contracts/IMeetingRepository';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class FirestoreMeetingRepository extends IMeetingRepository {
  constructor() {
    super();
    this.lock = new MutationLock();
    this.unsub = null;
  }

  async create(workspaceId, data) {
    const tempId = data.id || data.tempId || `temp_${Date.now()}`;
    return await this.lock.acquire(tempId, async () => {
      const startTime = performance.now();
      
      const meetingRef = doc(collection(db, 'workspaces', workspaceId, 'meetings'));
      const meetingId = meetingRef.id;
      
      const meetingDoc = {
        ...data,
        id: meetingId,
        tempId: tempId, // Keep tempId so snapshot listener can resolve it!
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system',
        status: 'active',
        schemaVersion: 1
      };

      try {
        await setDoc(meetingRef, meetingDoc);

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'meetings',
          entityId: meetingId
        });

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('meeting.created', buildEvent('meeting.created', meetingId, meetingDoc));
        return meetingDoc;
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
      
      const meetingRef = doc(db, 'workspaces', workspaceId, 'meetings', meetingId);
      
      const {
        createdAt: _createdAt,
        createdBy: _createdBy,
        schemaVersion: _schemaVersion,
        id: _id,
        workspaceId: _wsId,
        tempId: _tempId,
        ...mutableFields
      } = data;

      const updateData = {
        ...mutableFields,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system'
      };

      try {
        await updateDoc(meetingRef, updateData);

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

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('meeting.updated', buildEvent('meeting.updated', meetingId, updateData));
        return { id: meetingId, ...updateData };
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
    return this.update(workspaceId, meetingId, { status: 'deleted' });
  }

  async restore(workspaceId, meetingId) {
    return this.update(workspaceId, meetingId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    const colRef = collection(db, 'workspaces', workspaceId, 'meetings');
    this.unsub = onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== 'deleted') {
          list.push({ id: docSnap.id, ...data });
        }
      });
      callback(list);
    });
    return this.unsub;
  }

  unsubscribe() {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
  }
}
