const { db } = require('../../config/firebase');

class WorkspaceIndexRepository {
  /**
   * Fast lookup of a user's workspace association
   */
  async findByUid(uid) {
    const doc = await db.collection('workspaceIndex').doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() };
  }

  /**
   * Create or update the workspace index for a user
   */
  async setIndex(uid, workspaceId, status = 'active') {
    await db.collection('workspaceIndex').doc(uid).set({
      workspaceId,
      status,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Remove the workspace index for a user
   */
  async removeIndex(uid) {
    await db.collection('workspaceIndex').doc(uid).delete();
  }
}

module.exports = new WorkspaceIndexRepository();
