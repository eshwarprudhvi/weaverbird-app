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
   * Hashes the token if we want to store it securely (optional, but good practice).
   * Here we can just store the token as is for simplicity, 
   * since it's used as a secure lookup key.
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Resolves an invitation by token.
   */
  async resolveByToken(token) {
    // If we hashed the token before storing, we'd hash here.
    // Assuming we store the raw token in the document for lookup.
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
   * Validates if the invitation matches the expected email and is pending.
   */
  validateInvitationSecurity(invitation, userEmail) {
    if (!invitation) {
      return { valid: false, reason: 'Invitation not found.' };
    }
    
    if (invitation.status !== 'pending') {
      return { valid: false, reason: `Invitation is no longer pending (status: ${invitation.status}).` };
    }

    // Expiration check (can be double-checked here even if Jobs cleans it up)
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { valid: false, reason: 'Invitation has expired.' };
    }

    // Security: Only the exact invited email can accept it
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { valid: false, reason: 'This invitation was sent to a different email address.' };
    }

    return { valid: true };
  }
}

module.exports = new InvitationTokenService();
