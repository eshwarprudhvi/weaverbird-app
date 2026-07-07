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
      const batch = writeBatch(db);
      
      const token = `tok_${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
      const invitationId = token; // Use token as the document ID to bypass collection query validation rules
      const inviteRef = doc(db, 'invitations', invitationId);

      const normalizedEmail = data.email.trim().toLowerCase();
      
      const expiresInDays = data.expiresInDays || 7;
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
      const invitedBy = auth.currentUser?.displayName || auth.currentUser?.email || 'Administrator';
      
      const inviteDoc = {
        id: invitationId,
        token,
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

      // Create a deterministic lookup pointer in invitationsActive to allow security rule verification
      const activeRef = doc(db, 'invitationsActive', `${workspaceId}_${normalizedEmail}`);
      batch.set(activeRef, {
        invitationId: invitationId,
        workspaceId: workspaceId,
        email: normalizedEmail,
        status: 'pending',
        updatedAt: serverTimestamp()
      });


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

  async validateToken(token) {
    try {
      console.log(`[FirestoreInvitationRepository] Validating invitation token document: ${token}`);
      const inviteRef = doc(db, 'invitations', token);
      const snap = await getDoc(inviteRef);
      if (!snap.exists()) {
        console.warn(`[FirestoreInvitationRepository] Invitation document not found for token: ${token}`);
        return null;
      }
      const data = snap.data();
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        console.warn('[FirestoreInvitationRepository] No authenticated user found during validation');
        return null;
      }
      
      const normalizedUserEmail = userEmail.trim().toLowerCase();
      const normalizedInviteEmail = data.email.trim().toLowerCase();
      if (normalizedUserEmail !== normalizedInviteEmail) {
        console.warn(`[FirestoreInvitationRepository] User email ${normalizedUserEmail} does not match invitation email ${normalizedInviteEmail}`);
        return null;
      }

      if (data.status !== 'pending') {
        console.warn(`[FirestoreInvitationRepository] Invitation status is ${data.status}, expected pending`);
        return null;
      }
      
      console.log('[FirestoreInvitationRepository] Invitation token validated successfully');
      return { id: snap.id, ...data };
    } catch (error) {
      console.error('[FirestoreInvitationRepository] Validate token failed:', error);
      throw error;
    }
  }

  async accept(idOrToken) {
    try {
      console.log(`[FirestoreInvitationRepository] Starting accept operation for token/ID: ${idOrToken}`);
      const userEmail = auth.currentUser?.email;
      const userId = auth.currentUser?.uid;
      if (!userId || !userEmail) {
        throw new Error('User not authenticated');
      }
      const normalizedUserEmail = userEmail.trim().toLowerCase();

      // Legacy support: resolve actual document reference if idOrToken is a token field value rather than the document ID
      let inviteDocRef = doc(db, 'invitations', idOrToken);
      let directSnap = await getDoc(inviteDocRef);
      if (!directSnap.exists()) {
        const q = query(collection(db, 'invitations'), where('token', '==', idOrToken));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          inviteDocRef = doc(db, 'invitations', qSnap.docs[0].id);
        } else {
          throw new Error('This invitation is no longer available.');
        }
      }

      // We run a transactional onboarding operation for direct client-side safety
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
          invitationId: inviteDocRef.id // Store the invitation ID for security rules validation!
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

        // 9. Update the active invitation pointer status
        const activeRef = doc(db, 'invitationsActive', `${inviteData.workspaceId}_${normalizedUserEmail}`);
        transaction.update(activeRef, {
          status: 'accepted',
          updatedAt: serverTimestamp()
        });

        return { workspaceId: inviteData.workspaceId, role: inviteData.role, workspaceName: inviteData.workspaceName || 'Studio Workspace' };
      });


      console.log(`[FirestoreInvitationRepository] Invitation accepted successfully! Workspace ID: ${result.workspaceId}`);

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.accepted', { idOrToken });
      }

      return result;
    } catch (error) {
      console.error('[FirestoreInvitationRepository] Accept invitation failed:', error);
      throw error;
    }
  }

  async decline(idOrToken) {
    try {
      console.log(`[FirestoreInvitationRepository] Declining invitation: ${idOrToken}`);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) throw new Error('User email not found');
      const normalizedUserEmail = userEmail.trim().toLowerCase();

      // Legacy support: resolve actual document reference if idOrToken is a token field value rather than the document ID
      let inviteRef = doc(db, 'invitations', idOrToken);
      let snap = await getDoc(inviteRef);
      if (!snap.exists()) {
        const q = query(collection(db, 'invitations'), where('token', '==', idOrToken));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          inviteRef = doc(db, 'invitations', qSnap.docs[0].id);
          snap = qSnap.docs[0];
        } else {
          throw new Error('Invitation not found');
        }
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

      // Update the active invitation pointer status
      const activeRef = doc(db, 'invitationsActive', `${inviteData.workspaceId}_${normalizedUserEmail}`);
      await updateDoc(activeRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      }).catch(err => console.warn('Active invitation pointer not found/updated:', err));

      if (workspaceEventBus) {
        workspaceEventBus.emit('invitation.declined', { idOrToken });
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
      const snap = await getDoc(inviteRef);
      
      await updateDoc(inviteRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      if (snap.exists()) {
        const inviteData = snap.data();
        const activeRef = doc(db, 'invitationsActive', `${inviteData.workspaceId}_${inviteData.email}`);
        await updateDoc(activeRef, {
          status: 'cancelled',
          updatedAt: serverTimestamp()
        }).catch(err => console.warn('Active invitation pointer status sync warning:', err));
      }

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
      const snap = await getDoc(inviteRef);
      
      const updateData = {
        status: 'pending',
        updatedAt: serverTimestamp(),
        ...data
      };
      await updateDoc(inviteRef, updateData);

      if (snap.exists()) {
        const inviteData = snap.data();
        const activeRef = doc(db, 'invitationsActive', `${inviteData.workspaceId}_${inviteData.email}`);
        await updateDoc(activeRef, {
          status: 'pending',
          updatedAt: serverTimestamp()
        }).catch(err => console.warn('Active invitation pointer status sync warning:', err));
      }

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
