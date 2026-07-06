const { db } = require('../../config/firebase');

class InvitationRepository {
  /**
   * Create a new invitation in the root collection
   */
  async create(invitationData) {
    const docRef = await db.collection('invitations').add({
      ...invitationData,
      status: 'pending',
      version: 1,
      acceptedAt: null,
      declinedAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  /**
   * Find an invitation by its ID
   */
  async findById(invitationId) {
    if (!invitationId) return null;
    const doc = await db.collection('invitations').doc(invitationId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find an invitation by token
   */
  async findByToken(token) {
    if (!token) return null;
    const snapshot = await db.collection('invitations')
      .where('token', '==', token)
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Find pending invitation for a specific workspace and email (to prevent duplicates)
   */
  async findPendingByWorkspaceAndEmail(workspaceId, email) {
    if (!workspaceId || !email) return null;
    const snapshot = await db.collection('invitations')
      .where('workspaceId', '==', workspaceId)
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
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
   * Update invitation on resend (new token and expiration)
   */
  async updateResend(invitationId, newToken, newExpiresAt) {
    await db.collection('invitations').doc(invitationId).update({
      token: newToken,
      expiresAt: newExpiresAt,
      status: 'pending',
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Find all pending invitations for a specific email
   */
  async findPendingByEmail(email) {
    if (!email) return [];
    const snapshot = await db.collection('invitations')
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Find all invitations for a specific workspace (for Owner/Admin Management)
   */
  async findByWorkspace(workspaceId) {
    if (!workspaceId) return [];
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
