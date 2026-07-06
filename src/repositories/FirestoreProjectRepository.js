import { doc, setDoc, updateDoc, collection, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { IProjectRepository } from './contracts/IProjectRepository';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class FirestoreProjectRepository extends IProjectRepository {
  constructor() {
    super();
    this.lock = new MutationLock();
    this.unsub = null;
  }

  async create(workspaceId, data) {
    const tempId = data.id || data.tempId || `temp_${Date.now()}`;
    return await this.lock.acquire(tempId, async () => {
      const startTime = performance.now();
      const batch = writeBatch(db);

      // Generate a permanent Firestore ID synchronously on the client
      const projectRef = doc(collection(db, 'workspaces', workspaceId, 'projects'));
      const projectId = projectRef.id;

      const projectDoc = {
        ...data,
        id: projectId,
        tempId: tempId, // Keep tempId so snapshot listener can resolve it!
        name: data.name || 'Untitled Project',
        status: data.status || 'not-started',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system',
        schemaVersion: 1
      };

      batch.set(projectRef, projectDoc);

      try {
        await batch.commit();

        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'create', duration, retryCount: 0, success: true, workspaceId, entityType: 'projects', entityId: projectId });

        const buildEvent = (type, entityId, payload) => ({ type, workspaceId, entityId, timestamp: new Date().toISOString(), payload });
        workspaceEventBus.emit('project.created', buildEvent('project.created', projectId, projectDoc));
        return projectDoc;
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'create', duration, retryCount: 0, success: false, failure: err, workspaceId, entityType: 'projects', entityId: tempId });
        throw err;
      }
    }, data);
  }

  async update(workspaceId, projectId, data) {
    return await this.lock.acquire(projectId, async () => {
      const startTime = performance.now();

      const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);

      // Strip immutable fields — the update rule enforces isUnchanged() on these.
      // Sending them causes permission-denied even when values haven't changed
      // because updateDoc() marks them as "touched".
      // Also strip client-only identifiers that have no place in the update payload.
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
        // Strict CRUD: updateDoc() only. If the document does not exist in Firestore,
        // this is a synchronization bug — the caller should have used create() first.
        // setDoc+merge is intentionally NOT used here: it silently creates malformed
        // partial documents that break the isUnchanged() security rule checks.
        await updateDoc(projectRef, updateData);

        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'update', duration, retryCount: 0, success: true, workspaceId, entityType: 'projects', entityId: projectId });

        const buildEvent = (type, entityId, payload) => ({ type, workspaceId, entityId, timestamp: new Date().toISOString(), payload });
        workspaceEventBus.emit('project.updated', buildEvent('project.updated', projectId, updateData));

        return { id: projectId, ...updateData };
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'update', duration, retryCount: 0, success: false, failure: err, workspaceId, entityType: 'projects', entityId: projectId });
        throw err;
      }
    }, data);
  }

  async delete(workspaceId, projectId) {
    return await this.lock.acquire(projectId, async () => {
      const startTime = performance.now();
      const batch = writeBatch(db);

      const projectRef = doc(db, 'workspaces', workspaceId, 'projects', projectId);
      const deletedRef = doc(db, 'workspaces', workspaceId, 'deleted_projects', projectId);

      // 1. Mark as status: 'deleted'
      batch.update(projectRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system'
      });

      // 2. Add to deleted_projects subcollection
      batch.set(deletedRef, {
        deletedAt: serverTimestamp(),
        deletedBy: auth.currentUser?.uid || 'system',
        schemaVersion: 1
      });

      try {
        await batch.commit();

        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'delete', duration, retryCount: 0, success: true, workspaceId, entityType: 'projects', entityId: projectId });

        const buildEvent = (type, entityId, payload) => ({ type, workspaceId, entityId, timestamp: new Date().toISOString(), payload });
        workspaceEventBus.emit('project.deleted', buildEvent('project.deleted', projectId, { id: projectId }));
      } catch (err) {
        const duration = performance.now() - startTime;
        publishMetrics({ operation: 'delete', duration, retryCount: 0, success: false, failure: err, workspaceId, entityType: 'projects', entityId: projectId });
        throw err;
      }
    });
  }

  async restore(workspaceId, projectId) {
    return this.update(workspaceId, projectId, { status: 'active', isTrashed: false, trashedAt: null });
  }

  subscribe(workspaceId, callback) {
    const colRef = collection(db, 'workspaces', workspaceId, 'projects');
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

