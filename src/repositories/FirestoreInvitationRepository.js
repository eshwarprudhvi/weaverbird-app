import { doc, getDoc, getDocs, collection, query, where, serverTimestamp, runTransaction, updateDoc, writeBatch } from 'firebase/firestore';
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
      
      const currentUid = auth.currentUser?.uid;
      const currentEmail = auth.currentUser?.email;
      console.log("[FirestoreInvitationRepository] [Auth Verification]");
      console.log(`- currentUid: ${currentUid}`);
      console.log(`- currentEmail: ${currentEmail}`);
      console.log(`- workspaceId: ${workspaceId}`);
      
      const batch = writeBatch(db);
      const inviteRef = doc(collection(db, 'invitations'));
      const invitationId = inviteRef.id;

      const normalizedEmail = data.email.trim().toLowerCase();
      
      const expiresInDays = data.expiresInDays || 7;
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
      const invitedBy = auth.currentUser?.displayName || auth.currentUser?.email || 'Administrator';
      
      const inviteDoc = {
        email: normalizedEmail,
        workspaceId,
        workspaceName: data.workspaceName || 'Studio Workspace',
        role: data.role || 'member',
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system',
        invitedBy,
        expiresAt,
        schemaVersion: 1
      };
      
      batch.set(inviteRef, inviteDoc);

      console.log("=========================================");
      console.log("INVITATION WRITE DIAGNOSTICS");
      console.log("Path: /invitations/" + inviteRef.id);
      console.log("Payload:", JSON.stringify({
        ...inviteDoc,
        createdAt: "serverTimestamp()"
      }, null, 2));
      console.log("=========================================");

      try {
        await batch.commit();

        const duration = performance.now() - startTime;
        publishMetrics({
          entityType: 'invitation',
          operation: 'create',
          duration,
          success: true,
          workspaceId,
          entityId: invitationId
        });

        if (workspaceEventBus) {
          workspaceEventBus.emit('invitation.created', { id: invitationId, ...inviteDoc });
        }

        return { id: invitationId, ...inviteDoc };
      } catch (error) {
        const duration = performance.now() - startTime;
        
        console.error({
          code: error.code,
          message: error.message,
          stack: error.stack
        });

        publishMetrics({
          entityType: 'invitation',
          operation: 'create',
          duration,
          success: false,
          workspaceId,
          entityId: invitationId,
          failure: error
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
    if (!auth.currentUser) {
      throw new Error('[FirestoreInvitationRepository] Cannot query invitations: authentication is not complete or user is logged out.');
    }
    try {
      const userEmail = auth.currentUser.email;
      if (!userEmail) return [];
      const normalizedEmail = userEmail.trim().toLowerCase();
      console.log(`[FirestoreInvitationRepository] Querying pending invitations for email: ${normalizedEmail}`);
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      console.log(`[FirestoreInvitationRepository] Found ${list.length} pending invitations for ${normalizedEmail}`);
      return list;
    } catch (error) {
      console.error('[FirestoreInvitationRepository] Failed to list my invitations:', error);
      return [];
    }
  }

  async accept(invitationId) {
    try {
      console.log(`[FirestoreInvitationRepository] Starting accept operation for ID: ${invitationId}`);
      const userEmail = auth.currentUser?.email;
      const userId = auth.currentUser?.uid;
      if (!userId || !userEmail) {
        throw new Error('User not authenticated');
      }
      const normalizedUserEmail = userEmail.trim().toLowerCase();

      const inviteDocRef = doc(db, 'invitations', invitationId);

      const result = await runTransaction(db, async (transaction) => {
        console.log(`[FirestoreInvitationRepository] [Transaction] Fetching invitation document`);
        const txSnap = await transaction.get(inviteDocRef);
        
        if (!txSnap.exists()) {
          throw new Error('This invitation is no longer available.');
        }

        const inviteData = txSnap.data();

        // 1. Ownership validation
        const normalizedInviteEmail = inviteData.email.trim().toLowerCase();
        if (normalizedInviteEmail !== normalizedUserEmail) {
          throw new Error('This invitation belongs to another user.');
        }

        // 2. Status & Idempotency check
        if (inviteData.status === 'accepted') {
          return { 
            workspaceId: inviteData.workspaceId, 
            role: inviteData.role, 
            workspaceName: inviteData.workspaceName || 'Studio Workspace',
            alreadyAccepted: true 
          };
        }
        if (inviteData.status !== 'pending') {
          throw new Error(`Invitation is already ${inviteData.status}`);
        }

        // 3. Expiration validation
        if (inviteData.expiresAt && new Date(inviteData.expiresAt).getTime() < Date.now()) {
          throw new Error('This invitation has expired.');
        }

        // 4. Verify that the workspace actually exists in the database
        const wsRef = doc(db, 'workspaces', inviteData.workspaceId);
        const wsSnap = await transaction.get(wsRef);
        if (!wsSnap.exists()) {
          throw new Error('Workspace no longer exists.');
        }

        // 5. Verify the user is not already a member
        const memberRef = doc(db, 'workspaces', inviteData.workspaceId, 'members', userId);
        const memberSnap = await transaction.get(memberRef);
        if (memberSnap.exists()) {
          throw new Error('You are already a member of this workspace.');
        }

        // 6. Create membership document
        console.log(`[FirestoreInvitationRepository] [Transaction] Creating member document in workspace: ${inviteData.workspaceId}`);
        transaction.set(memberRef, {
          email: inviteData.email,
          name: auth.currentUser?.displayName || auth.currentUser?.email || 'Collaborator',
          role: inviteData.role,
          status: 'active',
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          invitationId: inviteDocRef.id
        });

        // 7. Create workspaceIndex reference
        console.log(`[FirestoreInvitationRepository] [Transaction] Creating workspaceIndex for user: ${userId}`);
        const indexRef = doc(db, 'workspaceIndex', userId);
        transaction.set(indexRef, {
          workspaceId: inviteData.workspaceId,
          role: inviteData.role,
          status: 'active',
          updatedAt: serverTimestamp()
        });

        // 8. Mark invitation as accepted
        console.log(`[FirestoreInvitationRepository] [Transaction] Marking invitation status as accepted`);
        transaction.update(inviteDocRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: userId
        });

        return { workspaceId: inviteData.workspaceId, role: inviteData.role, workspaceName: inviteData.workspaceName || 'Studio Workspace' };
      });

      console.log(`[FirestoreInvitationRepository] Invitation accepted successfully! Workspace ID: ${result.workspaceId}`);

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.accepted', { idOrToken: invitationId });
      }

      return result;
    } catch (error) {
      console.error('[FirestoreInvitationRepository] Accept invitation failed:', error);
      throw error;
    }
  }

  async decline(invitationId) {
    try {
      console.log(`[FirestoreInvitationRepository] Declining invitation: ${invitationId}`);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) throw new Error('User email not found');
      const normalizedUserEmail = userEmail.trim().toLowerCase();

      const inviteRef = doc(db, 'invitations', invitationId);
      const snap = await getDoc(inviteRef);
      if (!snap.exists()) {
        throw new Error('Invitation not found');
      }

      const inviteData = snap.data();
      const normalizedInviteEmail = inviteData.email.trim().toLowerCase();
      if (normalizedInviteEmail !== normalizedUserEmail) {
        throw new Error(`This invitation was sent to ${normalizedInviteEmail} but you are logged in as ${normalizedUserEmail}`);
      }

      console.log('[FirestoreInvitationRepository] Updating invitation status to declined');
      await updateDoc(inviteRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      });

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.declined', { idOrToken: invitationId });
      }

      return { status: 'declined' };
    } catch (error) {
      console.error('[FirestoreInvitationRepository] Decline invitation failed:', error);
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
    return () => {};
  }

  unsubscribe() {}
}
