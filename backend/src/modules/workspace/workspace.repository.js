const { db } = require('../../config/firebase');

class WorkspaceRepository {
  async create(data) {
    const docRef = await db.collection('workspaces').add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
    return docRef.id;
  }

  async findById(workspaceId) {
    const doc = await db.collection('workspaces').doc(workspaceId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async getMember(workspaceId, userId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .get();
      
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async update(workspaceId, data) {
    await db.collection('workspaces').doc(workspaceId).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async getMembers(workspaceId) {
    const snapshot = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addMember(workspaceId, userId, memberData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .set({
        ...memberData,
        joinedAt: new Date().toISOString(),
      });
  }

  async updateMember(workspaceId, userId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }

  async deleteMember(workspaceId, userId, removedByUserId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .update({
        status: 'removed',
        removedAt: new Date().toISOString(),
        removedBy: removedByUserId,
      });
  }

  async createInvitation(workspaceId, invitationData) {
    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('invitations')
      .add({
        ...invitationData,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
    return docRef.id;
  }
}

module.exports = new WorkspaceRepository();
