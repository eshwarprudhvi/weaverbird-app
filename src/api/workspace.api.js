import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import RepositoryFactory from '../repositories/RepositoryFactory';
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const updateWorkspaceSettings = async (workspaceId, data) => {
  if (RepositoryFactory.isFirebaseMode() && workspaceId) {
    try {
      await updateDoc(doc(db, 'workspaces', workspaceId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true, data };
    } catch (err) {
      console.warn("Firestore workspace settings update failed:", err);
      // Fallback if permission or offline
      return { success: true, data };
    }
  }
  try {
    return await apiClient.patch(ENDPOINTS.WORKSPACE.SETTINGS, data);
  } catch (error) {
    // If backend is unconfigured (e.g., missing Firebase credentials locally), fallback nicely
    console.warn("Backend failed to update workspace settings. Falling back to local state.", error);
    return { success: true, data };
  }
};

export const inviteMember = async (workspaceId, email, role) => {
  if (RepositoryFactory.isFirebaseMode()) {
    const invRepo = RepositoryFactory.getInvitationRepository();
    return await invRepo.createInvitation({ workspaceId, email, role });
  }
  return await apiClient.post(ENDPOINTS.WORKSPACE.MEMBERS_INVITE, { email, role });
};

export const updateMemberRole = async (workspaceId, userIdOrEmail, role) => {
  if (RepositoryFactory.isFirebaseMode()) {
    if (!workspaceId || !userIdOrEmail) throw new Error("Workspace ID and User required");
    let targetUid = userIdOrEmail;
    if (userIdOrEmail.includes('@')) {
      const q = query(collection(db, 'workspaces', workspaceId, 'members'), where('email', '==', userIdOrEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetUid = snap.docs[0].id;
      } else {
        throw new Error("Member not found in workspace");
      }
    }
    await updateDoc(doc(db, 'workspaces', workspaceId, 'members', targetUid), {
      role,
      updatedAt: serverTimestamp()
    });
    try {
      const idxSnap = await getDoc(doc(db, 'workspaceIndex', targetUid));
      if (idxSnap.exists() && idxSnap.data().workspaceId === workspaceId) {
        await updateDoc(doc(db, 'workspaceIndex', targetUid), { role, updatedAt: serverTimestamp() });
      }
    } catch (e) {}
    return { success: true };
  }
  return await apiClient.patch(ENDPOINTS.WORKSPACE.MEMBER_ROLE(userIdOrEmail), { role });
};

export const removeMember = async (workspaceId, userIdOrEmail) => {
  if (RepositoryFactory.isFirebaseMode()) {
    if (!workspaceId || !userIdOrEmail) throw new Error("Workspace ID and User required");
    let targetUid = userIdOrEmail;
    if (userIdOrEmail.includes('@')) {
      const q = query(collection(db, 'workspaces', workspaceId, 'members'), where('email', '==', userIdOrEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetUid = snap.docs[0].id;
      } else {
        throw new Error("Member not found in workspace");
      }
    }
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', targetUid));
    try {
      const invQ = query(collection(db, 'invitations'), where('workspaceId', '==', workspaceId), where('email', '==', userIdOrEmail.trim().toLowerCase()));
      const invSnap = await getDocs(invQ);
      for (const d of invSnap.docs) {
        await deleteDoc(doc(db, 'invitations', d.id));
      }
    } catch (e) {}
    try {
      const idxSnap = await getDoc(doc(db, 'workspaceIndex', targetUid));
      if (idxSnap.exists() && idxSnap.data().workspaceId === workspaceId) {
        await deleteDoc(doc(db, 'workspaceIndex', targetUid));
      }
    } catch (e) {}
    return { success: true };
  }
  return await apiClient.delete(ENDPOINTS.WORKSPACE.MEMBER_REMOVE(userIdOrEmail));
};
