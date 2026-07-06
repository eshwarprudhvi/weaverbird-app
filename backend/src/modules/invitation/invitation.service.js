const invitationRepo = require('./invitation.repository');
const invitationTokenService = require('./invitationToken.service');
const workspaceRepo = require('../workspace/workspace.repository');
const { db } = require('../../config/firebase');
const EventBus = require('../../shared/services/EventBus');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

class InvitationService {
  /**
   * Helper to verify inviter has Owner or Admin role
   */
  _verifyAdminOrOwner(currentUser) {
    const role = (currentUser && currentUser.role ? currentUser.role : '').toLowerCase();
    if (!['owner', 'admin'].includes(role)) {
      throw new AppError('Only Owner or Admin can perform this action', 403, errorCodes.PERMISSION_DENIED);
    }
  }

  /**
   * Helper to resolve invitation by ID or Token string
   */
  async _resolveInvitation(idOrToken) {
    if (!idOrToken) return null;
    let invitation = await invitationRepo.findById(idOrToken);
    if (!invitation) {
      invitation = await invitationRepo.findByToken(idOrToken);
    }
    return invitation;
  }

  /**
   * Create an invitation
   */
  async createInvitation(workspaceId, email, role, currentUser, message = '', expiresInDays = 7) {
    this._verifyAdminOrOwner(currentUser);

    if (!email || !workspaceId) {
      throw new AppError('Email and workspace ID are required', 400, errorCodes.VALIDATION_ERROR);
    }

    const cleanEmail = email.toLowerCase().trim();
    if (currentUser.email && cleanEmail === currentUser.email.toLowerCase()) {
      throw new AppError('You cannot invite yourself to the workspace', 400, errorCodes.VALIDATION_ERROR);
    }

    try {
      // Check if recipient is already an active member
      const existingMembers = await workspaceRepo.getMembers(workspaceId);
      const isAlreadyMember = existingMembers.some(
        m => (m.email || '').toLowerCase() === cleanEmail && m.status !== 'removed'
      );
      if (isAlreadyMember) {
        throw new AppError('This user is already an active member of the workspace', 400, errorCodes.VALIDATION_ERROR);
      }

      // Check for existing pending invitation in this workspace
      const existingInvite = await invitationRepo.findPendingByWorkspaceAndEmail(workspaceId, cleanEmail);
      if (existingInvite) {
        throw new AppError('A pending invitation already exists for this email address in this workspace', 400, errorCodes.VALIDATION_ERROR);
      }

      const token = invitationTokenService.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (Number(expiresInDays) || 7));

      const normalizedRole = role ? role.toLowerCase() : 'member';

      const invitationData = {
        workspaceId,
        email: cleanEmail,
        role: normalizedRole,
        token,
        message: message || '',
        invitedBy: currentUser.email || currentUser.uid,
        expiresAt: expiresAt.toISOString()
      };

      const invitationId = await invitationRepo.create(invitationData);
      const invitation = await invitationRepo.findById(invitationId);

      // Emit event (non-blocking — errors in subscribers are caught by EventBus)
      EventBus.publish('invitation.created', { invitation });

      return invitation;
    } catch (error) {
      // Re-throw operational AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap unexpected Firestore/infrastructure errors
      throw new AppError(
        `Failed to create invitation: ${error.message || 'Unknown error'}`,
        500,
        errorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Resend an invitation (Regenerate token & expiration)
   */
  async resendInvitation(invitationId, workspaceId, currentUser, expiresInDays = 7) {
    this._verifyAdminOrOwner(currentUser);

    const invitation = await invitationRepo.findById(invitationId);
    if (!invitation) {
      throw new AppError('Invitation not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }

    if (invitation.workspaceId !== workspaceId) {
      throw new AppError('Permission denied', 403, errorCodes.PERMISSION_DENIED);
    }

    if (invitation.status === 'accepted') {
      throw new AppError('Cannot resend an invitation that has already been accepted', 400, errorCodes.VALIDATION_ERROR);
    }

    const newToken = invitationTokenService.generateToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + (Number(expiresInDays) || 7));

    await invitationRepo.updateResend(invitationId, newToken, newExpiresAt.toISOString());
    const updatedInvitation = await invitationRepo.findById(invitationId);

    EventBus.publish('invitation.created', { invitation: updatedInvitation, resent: true });
    return updatedInvitation;
  }

  /**
   * Accept an invitation securely inside an atomic transaction
   */
  async acceptInvitation(idOrToken, currentUser) {
    const invitation = await this._resolveInvitation(idOrToken);
    
    // Secure validation
    const validation = invitationTokenService.validateInvitationSecurity(invitation, currentUser.email);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400, errorCodes.VALIDATION_ERROR);
    }

    // Execute atomic acceptance transaction
    await db.runTransaction(async (t) => {
      const memberRef = db.collection('workspaces').doc(invitation.workspaceId).collection('members').doc(currentUser.uid);
      const indexRef = db.collection('workspaceIndex').doc(currentUser.uid);
      const inviteRef = db.collection('invitations').doc(invitation.id);

      // Verify member inside transaction
      const memberSnap = await t.get(memberRef);
      if (memberSnap.exists && memberSnap.data().status === 'active') {
        throw new AppError('You are already an active member of this workspace', 400, errorCodes.VALIDATION_ERROR);
      }

      const now = new Date().toISOString();
      const normalizedRole = invitation.role ? invitation.role.toLowerCase() : 'member';

      // 1. Create members/{uid}
      t.set(memberRef, {
        role: normalizedRole,
        status: 'active',
        email: currentUser.email,
        createdBy: invitation.invitedBy || 'system',
        joinedAt: now,
        updatedAt: now
      });

      // 2. Create workspaceIndex/{uid}
      t.set(indexRef, {
        workspaceId: invitation.workspaceId,
        role: normalizedRole,
        status: 'active',
        updatedAt: now
      });

      // 3. Update invitation status
      t.update(inviteRef, {
        status: 'accepted',
        acceptedAt: now,
        acceptedBy: currentUser.uid,
        updatedAt: now
      });
    });

    EventBus.publish('member.created', {
      uid: currentUser.uid,
      workspaceId: invitation.workspaceId,
      role: invitation.role
    });

    EventBus.publish('invitation.accepted', {
      invitationId: invitation.id,
      workspaceId: invitation.workspaceId,
      uid: currentUser.uid
    });

    return { workspaceId: invitation.workspaceId };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(idOrToken, currentUser) {
    const invitation = await this._resolveInvitation(idOrToken);
    
    const validation = invitationTokenService.validateInvitationSecurity(invitation, currentUser.email);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400, errorCodes.VALIDATION_ERROR);
    }

    await invitationRepo.updateStatus(invitation.id, 'declined', 'declinedAt');

    EventBus.publish('invitation.declined', {
      invitationId: invitation.id,
      workspaceId: invitation.workspaceId,
      uid: currentUser.uid
    });

    return { success: true };
  }

  /**
   * Cancel an invitation (By Owner or Admin)
   */
  async cancelInvitation(invitationId, workspaceId, currentUser) {
    this._verifyAdminOrOwner(currentUser);

    const invitation = await invitationRepo.findById(invitationId);
    if (!invitation) {
      throw new AppError('Invitation not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }

    if (invitation.workspaceId !== workspaceId) {
      throw new AppError('Permission denied', 403, errorCodes.PERMISSION_DENIED);
    }

    if (invitation.status !== 'pending') {
      throw new AppError(`Cannot cancel an invitation with status: ${invitation.status}`, 400, errorCodes.VALIDATION_ERROR);
    }

    await invitationRepo.updateStatus(invitationId, 'cancelled', 'cancelledAt');

    EventBus.publish('invitation.cancelled', {
      invitationId: invitation.id,
      workspaceId
    });

    return { success: true };
  }

  /**
   * Fetch pending invitations by email
   */
  async getPendingInvitations(email) {
    return invitationRepo.findPendingByEmail(email);
  }

  /**
   * Fetch invitations for a workspace (Owner/Admin)
   */
  async getWorkspaceInvitations(workspaceId, currentUser) {
    this._verifyAdminOrOwner(currentUser);
    return invitationRepo.findByWorkspace(workspaceId);
  }
}

module.exports = new InvitationService();
