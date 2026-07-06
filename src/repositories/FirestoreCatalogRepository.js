import { doc, setDoc, updateDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ICatalogRepository } from './contracts/ICatalogRepository';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class FirestoreCatalogRepository extends ICatalogRepository {
  constructor() {
    super();
    this.lock = new MutationLock();
    this.unsub = null;
  }

  async create(workspaceId, data) {
    const tempId = data.id || data.tempId || `temp_${Date.now()}`;
    return await this.lock.acquire(tempId, async () => {
      const startTime = performance.now();
      
      const itemRef = doc(collection(db, 'workspaces', workspaceId, 'catalog'));
      const itemId = itemRef.id;
      
      const itemDoc = {
        ...data,
        id: itemId,
        tempId: tempId, // Keep tempId so snapshot listener can resolve it!
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'system',
        status: 'active',
        schemaVersion: 1
      };
      
      try {
        await setDoc(itemRef, itemDoc);

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'create',
          duration,
          retryCount: 0,
          success: true,
          workspaceId,
          entityType: 'catalog',
          entityId: itemId
        });

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('catalogItem.created', buildEvent('catalogItem.created', itemId, itemDoc));
        return itemDoc;
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
      
      const itemRef = doc(db, 'workspaces', workspaceId, 'catalog', itemId);
      
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
        await updateDoc(itemRef, updateData);

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

        const buildEvent = (type, entityId, payload) => ({
          type,
          workspaceId,
          entityId,
          timestamp: new Date().toISOString(),
          payload
        });

        workspaceEventBus.emit('catalogItem.updated', buildEvent('catalogItem.updated', itemId, updateData));
        return { id: itemId, ...updateData };
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
    return this.update(workspaceId, itemId, { status: 'deleted' });
  }

  async restore(workspaceId, itemId) {
    return this.update(workspaceId, itemId, { status: 'active' });
  }

  subscribe(workspaceId, callback) {
    const colRef = collection(db, 'workspaces', workspaceId, 'catalog');
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
