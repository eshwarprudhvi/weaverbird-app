import { doc, setDoc, updateDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ITaskRepository } from './contracts/ITaskRepository';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class FirestoreTaskRepository extends ITaskRepository {
  constructor() {
    super();
    this.lock = new MutationLock();
    this.unsub = null;
  }

  async create(workspaceId, data) {
    const tempId = data.id || data.tempId || `temp_${Date.now()}`;
    return await this.lock.acquire(tempId, async () => {
      const startTime = performance.now();
      
      const taskRef = doc(collection(db, 'workspaces', workspaceId, 'tasks'));
      const taskId = taskRef.id;
      
      const taskDoc = {
        ...data,
        id: taskId,
        tempId: tempId, // Keep tempId so snapshot listener can resolve it!
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system',
        status: 'active',
        schemaVersion: 1
      };

      try {
        await setDoc(taskRef, taskDoc);

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'tasks',
          entityId: taskId
        });

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('task.created', buildEvent('task.created', taskId, taskDoc));
        return taskDoc;
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
      
      const taskRef = doc(db, 'workspaces', workspaceId, 'tasks', taskId);
      
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
        await updateDoc(taskRef, updateData);

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

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('task.updated', buildEvent('task.updated', taskId, updateData));
        return { id: taskId, ...updateData };
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
    return this.update(workspaceId, taskId, { status: 'deleted' });
  }

  async restore(workspaceId, taskId) {
    return this.update(workspaceId, taskId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    const colRef = collection(db, 'workspaces', workspaceId, 'tasks');
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
