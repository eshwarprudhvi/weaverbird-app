import { doc, getDocs, collection, query, where, serverTimestamp, runTransaction, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { publishMetrics } from './utils/metrics';
import { workspaceEventBus } from '../application/session';
import { MutationLock } from './utils/MutationLock';

export class FirestoreInvitationRepository {
  constructor() {
    this.lock = new MutationLock();
  }

  async create(workspaceId, data) {
    const lockKey = data.email || `inv_${Date.now()}`;
    return await this.lock.acquire(lockKey, async () => {
      const startTime = performance.now();
      const batch = writeBatch(db);
      
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const token = `tok_${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
      const inviteRef = doc(db, 'invitations', invitationId);

      const normalizedEmail = data.email.trim().toLowerCase();
      const inviteDoc = {
        id: invitationId,
        token,
        email: normalizedEmail,
        workspaceId,
        role: data.role || 'member',
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        schemaVersion: 1
      };
      
      batch.set(inviteRef, inviteDoc);


      try {
        await batch.commit();

        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'invitation:create',
          duration,
          success: true,
          workspaceId,
          entityId: invitationId
        });

        if (workspaceEventBus) {
          workspaceEventBus.emit('invitation.created', inviteDoc);
        }

        return inviteDoc;
      } catch (error) {
        const duration = performance.now() - startTime;
        publishMetrics({
          operation: 'invitation:create',
          duration,
          success: false,
          workspaceId,
          error: error.message
        });
        throw error;
      }
    }, data);
  }

  async listByWorkspace(workspaceId) {
    try {
      const q = query(collection(db, 'invitations'), where('workspaceId', '==', workspaceId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (error) {
      console.error('Failed to list workspace invitations:', error);
      return [];
    }
  }

  async listMy() {
    try {
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return [];
      const q = query(collection(db, 'invitations'), where('email', '==', userEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (error) {
      console.error('Failed to list my invitations:', error);
      return [];
    }
  }

  async validateToken(token) {
    try {
      const q = query(collection(db, 'invitations'), where('token', '==', token), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      let invitation = null;
      snap.forEach(docSnap => {
        invitation = { id: docSnap.id, ...docSnap.data() };
      });
      return invitation;
    } catch (error) {
      console.error('Validate token failed:', error);
      throw error;
    }
  }

  async accept(idOrToken) {
    try {
      // We run a transactional onboarding operation for direct client-side safety
      const result = await runTransaction(db, async (transaction) => {
        // Query invitation
        const q = query(collection(db, 'invitations'), where('token', '==', idOrToken));
        const inviteSnap = await getDocs(q);
        let inviteDocRef = null;
        let inviteData = null;

        if (!inviteSnap.empty) {
          inviteSnap.forEach(snap => {
            inviteDocRef = snap.ref;
            inviteData = snap.data();
          });
        } else {
          // Try fetching directly by document ID
          inviteDocRef = doc(db, 'invitations', idOrToken);
          const directSnap = await transaction.get(inviteDocRef);
          if (directSnap.exists()) {
            inviteData = directSnap.data();
          }
        }

        if (!inviteData) {
          throw new Error('Invitation not found');
        }

        if (inviteData.status !== 'pending') {
          throw new Error(`Invitation is already ${inviteData.status}`);
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // 1. Create membership document
        const memberRef = doc(db, 'workspaces', inviteData.workspaceId, 'members', userId);
        transaction.set(memberRef, {
          email: inviteData.email,
          name: auth.currentUser?.displayName || auth.currentUser?.email || 'Collaborator',
          role: inviteData.role,
          status: 'active',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 2. Create workspaceIndex reference
        const indexRef = doc(db, 'workspaceIndex', userId);
        transaction.set(indexRef, {
          workspaceId: inviteData.workspaceId,
          role: inviteData.role,
          status: 'active',
          updatedAt: serverTimestamp()
        });

        // 3. Mark invitation as accepted
        transaction.update(inviteDocRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: userId
        });

        return { workspaceId: inviteData.workspaceId, role: inviteData.role };
      });

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.accepted', { idOrToken });
      }

      return result;
    } catch (error) {
      console.error('Accept invitation failed:', error);
      throw error;
    }
  }

  async decline(idOrToken) {
    try {
      const q = query(collection(db, 'invitations'), where('token', '==', idOrToken));
      const snap = await getDocs(q);
      let inviteId = idOrToken;
      if (!snap.empty) {
        snap.forEach(docSnap => {
          inviteId = docSnap.id;
        });
      }

      const inviteRef = doc(db, 'invitations', inviteId);
      await updateDoc(inviteRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      });

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.declined', { idOrToken });
      }

      return { status: 'declined' };
    } catch (error) {
      console.error('Decline invitation failed:', error);
      throw error;
    }
  }

  async cancel(id) {
    try {
      const inviteRef = doc(db, 'invitations', id);
      await updateDoc(inviteRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.cancelled', { id });
      }

      return { status: 'cancelled' };
    } catch (error) {
      console.error('Cancel invitation failed:', error);
      throw error;
    }
  }

  async resend(id, data = {}) {
    try {
      const inviteRef = doc(db, 'invitations', id);
      const updateData = {
        status: 'pending',
        updatedAt: serverTimestamp(),
        ...data
      };
      await updateDoc(inviteRef, updateData);

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.resent', { id, ...updateData });
      }

      return { id, ...updateData };
    } catch (error) {
      console.error('Resend invitation failed:', error);
      throw error;
    }
  }

  subscribe(workspaceId, callback) {
    // Return empty unsubscribe as invitation lists fetch on-demand
    return () => {};
  }

  unsubscribe() {}
}
