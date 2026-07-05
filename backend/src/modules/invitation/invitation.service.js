const invitationRepo = require('./invitation.repository');
const invitationTokenService = require('./invitationToken.service');
const workspaceIndexRepo = require('../member/workspaceIndex.repository');
const workspaceRepo = require('../workspace/workspace.repository');
const EventBus = require('../../shared/services/EventBus');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

class InvitationService {
  /**
   * Create an invitation
   */
  async createInvitation(workspaceId, email, role, inviterUid) {
    // Basic checks
    if (!email || !workspaceId) {
      throw new AppError('Email and workspace ID are required', 400, errorCodes.VALIDATION_ERROR);
    }

    const token = invitationTokenService.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitationData = {
      workspaceId,
      email,
      role: role || 'Editor',
      token,
      invitedBy: inviterUid,
      expiresAt: expiresAt.toISOString()
    };

    const invitationId = await invitationRepo.create(invitationData);
    
    const invitation = await invitationRepo.findById(invitationId);

    // Emit event
    EventBus.publish('invitation.created', { invitation });

    return invitation;
  }

  /**
   * Accept an invitation securely
   */
  async acceptInvitation(token, currentUser) {
    const invitation = await invitationTokenService.resolveByToken(token);
    
    // Secure token validation
    const validation = invitationTokenService.validateInvitationSecurity(invitation, currentUser.email);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400, errorCodes.VALIDATION_ERROR);
    }

    // Check if user already has a workspace index
    const existingIndex = await workspaceIndexRepo.findByUid(currentUser.uid);
    if (existingIndex) {
      throw new AppError('You already belong to a workspace. You cannot accept another invitation.', 400, errorCodes.VALIDATION_ERROR);
    }

    // Add member to workspace (subcollection)
    await workspaceRepo.addMember(invitation.workspaceId, currentUser.uid, {
      role: invitation.role,
      status: 'active',
      createdBy: invitation.invitedBy
    });

    // Update workspace index
    await workspaceIndexRepo.setIndex(currentUser.uid, invitation.workspaceId, 'active');

    // Update invitation status
    await invitationRepo.updateStatus(invitation.id, 'accepted', 'acceptedAt');

    EventBus.publish('member.created', {
      uid: currentUser.uid,
      workspaceId: invitation.workspaceId,
      role: invitation.role
    });

    EventBus.publish('invitation.accepted', {
      invitationId: invitation.id,
      uid: currentUser.uid
    });

    return { workspaceId: invitation.workspaceId };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token, currentUser) {
    const invitation = await invitationTokenService.resolveByToken(token);
    
    const validation = invitationTokenService.validateInvitationSecurity(invitation, currentUser.email);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400, errorCodes.VALIDATION_ERROR);
    }

    await invitationRepo.updateStatus(invitation.id, 'declined', 'declinedAt');

    EventBus.publish('invitation.declined', {
      invitationId: invitation.id,
      uid: currentUser.uid
    });

    return { success: true };
  }

  /**
   * Cancel an invitation (By Owner)
   */
  async cancelInvitation(invitationId, workspaceId) {
    const invitation = await invitationRepo.findById(invitationId);
    if (!invitation) {
      throw new AppError('Invitation not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }

    if (invitation.workspaceId !== workspaceId) {
      throw new AppError('Permission denied', 403, errorCodes.PERMISSION_DENIED);
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
   * Fetch invitations for a workspace
   */
  async getWorkspaceInvitations(workspaceId) {
    return invitationRepo.findByWorkspace(workspaceId);
  }
}

module.exports = new InvitationService();
