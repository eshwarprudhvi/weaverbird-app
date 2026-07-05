const invitationService = require('./invitation.service');
const { successResponse } = require('../../core/utils/responseFormatter');

const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await invitationService.acceptInvitation(token, req.user);
    return successResponse(res, 200, 'Invitation accepted successfully', result);
  } catch (error) {
    next(error);
  }
};

const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    await invitationService.declineInvitation(token, req.user);
    return successResponse(res, 200, 'Invitation declined successfully', null);
  } catch (error) {
    next(error);
  }
};

const cancelInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    await invitationService.cancelInvitation(invitationId, req.workspace.id);
    return successResponse(res, 200, 'Invitation cancelled successfully', null);
  } catch (error) {
    next(error);
  }
};

const getPendingInvitations = async (req, res, next) => {
  try {
    // Only fetch for the authenticated user's email
    const invitations = await invitationService.getPendingInvitations(req.user.email);
    return successResponse(res, 200, 'Pending invitations retrieved', { invitations });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceInvitations = async (req, res, next) => {
  try {
    // Requires requireWorkspace middleware
    const invitations = await invitationService.getWorkspaceInvitations(req.workspace.id);
    return successResponse(res, 200, 'Workspace invitations retrieved', { invitations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getPendingInvitations,
  getWorkspaceInvitations
};
