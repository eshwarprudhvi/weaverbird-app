const { db } = require('../../config/firebase');

class WorkspaceRepository {
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
}

module.exports = new WorkspaceRepository();
