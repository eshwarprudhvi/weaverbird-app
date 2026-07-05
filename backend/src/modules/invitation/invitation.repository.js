const { db } = require('../../config/firebase');

class InvitationRepository {
  /**
   * Create a new invitation in the root collection
   */
  async create(invitationData) {
    const docRef = await db.collection('invitations').add({
      ...invitationData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  /**
   * Find an invitation by its ID
   */
  async findById(invitationId) {
    const doc = await db.collection('invitations').doc(invitationId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Update an invitation's status and lifecycle timestamps
   */
  async updateStatus(invitationId, status, timestampField = 'updatedAt') {
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (timestampField !== 'updatedAt') {
      updateData[timestampField] = new Date().toISOString();
    }
    
    await db.collection('invitations').doc(invitationId).update(updateData);
  }

  /**
   * Find all pending invitations for a specific email
   */
  async findPendingByEmail(email) {
    const snapshot = await db.collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Find all invitations for a specific workspace (for Owner Management)
   */
  async findByWorkspace(workspaceId) {
    const snapshot = await db.collection('invitations')
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  /**
   * Fetch all expired pending invitations (for Jobs module)
   */
  async getExpiredPendingInvitations() {
    const now = new Date().toISOString();
    const snapshot = await db.collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<', now)
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new InvitationRepository();
