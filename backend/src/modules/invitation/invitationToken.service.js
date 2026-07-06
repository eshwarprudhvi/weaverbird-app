const crypto = require('crypto');
const { db } = require('../../config/firebase');

class InvitationTokenService {
  /**
   * Generates a secure random token for invitations
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Resolves an invitation by token.
   */
  async resolveByToken(token) {
    if (!token) return null;
    const snapshot = await db.collection('invitations')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Returns a public summary of the invitation without requiring authentication
   * and without exposing Firestore internal document IDs.
   */
  async getPublicSummaryByToken(token) {
    const inv = await this.resolveByToken(token);
    if (!inv) {
      return { valid: false, reason: 'Invitation not found or invalid token.' };
    }

    const isExpired = inv.expiresAt && new Date(inv.expiresAt) < new Date();
    if (inv.status !== 'pending' || isExpired) {
      return { 
        valid: false, 
        reason: isExpired ? 'This invitation has expired.' : `This invitation is no longer active (${inv.status}).`,
        status: isExpired ? 'expired' : inv.status 
      };
    }

    // Fetch workspace display name cleanly
    let workspaceName = 'Workspace';
    try {
      const wsDoc = await db.collection('workspaces').doc(inv.workspaceId).get();
      if (wsDoc.exists) {
        const wsData = wsDoc.data();
        workspaceName = wsData.studioName || wsData.companyName || 'Workspace';
      }
    } catch (e) {
      // Fallback if workspace fetch fails
    }

    // Format role to Title Case for display
    const formattedRole = inv.role 
      ? inv.role.charAt(0).toUpperCase() + inv.role.slice(1).toLowerCase() 
      : 'Member';

    return {
      valid: true,
      summary: {
        token: inv.token,
        email: inv.email,
        role: formattedRole,
        workspaceName,
        invitedBy: inv.invitedBy || 'An administrator',
        expiresAt: inv.expiresAt,
        message: inv.message || '',
        status: 'pending'
      }
    };
  }

  /**
   * Validates if the invitation matches the expected email and is pending.
   */
  validateInvitationSecurity(invitation, userEmail) {
    if (!invitation) {
      return { valid: false, reason: 'Invitation not found.' };
    }
    
    if (invitation.status !== 'pending') {
      return { valid: false, reason: `Invitation is no longer pending (status: ${invitation.status}).` };
    }

    // Expiration check
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { valid: false, reason: 'Invitation has expired.' };
    }

    // Security: Only the exact invited email can accept it
    if (!userEmail || invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { valid: false, reason: 'This invitation was sent to a different email address.' };
    }

    return { valid: true };
  }
}

module.exports = new InvitationTokenService();
