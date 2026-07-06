const invitationService = require('./invitation.service');
const invitationTokenService = require('./invitationToken.service');
const { successResponse } = require('../../core/utils/responseFormatter');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

const createInvitation = async (req, res, next) => {
  try {
    const { email, role, message, expiresInDays } = req.body;
    const invitation = await invitationService.createInvitation(
      req.workspace.id,
      email,
      role,
      req.currentUser,
      message,
      expiresInDays
    );
    return successResponse(res, 201, 'Invitation created successfully', { invitation });
  } catch (error) {
    next(error);
  }
};

const resendInvitation = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.invitationId;
    const { expiresInDays } = req.body || {};
    const invitation = await invitationService.resendInvitation(
      id,
      req.workspace.id,
      req.currentUser,
      expiresInDays
    );
    return successResponse(res, 200, 'Invitation resent successfully', { invitation });
  } catch (error) {
    next(error);
  }
};

const validateToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await invitationTokenService.getPublicSummaryByToken(token);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
        status: result.status || 'invalid'
      });
    }
    return successResponse(res, 200, 'Token validated successfully', result.summary);
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const idOrToken = req.params.id || req.body.token;
    if (!idOrToken) {
      throw new AppError('Invitation token or ID is required', 400, errorCodes.VALIDATION_ERROR);
    }
    const result = await invitationService.acceptInvitation(idOrToken, req.user);
    return successResponse(res, 200, 'Invitation accepted successfully', result);
  } catch (error) {
    next(error);
  }
};

const declineInvitation = async (req, res, next) => {
  try {
    const idOrToken = req.params.id || req.body.token;
    if (!idOrToken) {
      throw new AppError('Invitation token or ID is required', 400, errorCodes.VALIDATION_ERROR);
    }
    await invitationService.declineInvitation(idOrToken, req.user);
    return successResponse(res, 200, 'Invitation declined successfully', null);
  } catch (error) {
    next(error);
  }
};

const cancelInvitation = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.invitationId;
    await invitationService.cancelInvitation(id, req.workspace.id, req.currentUser);
    return successResponse(res, 200, 'Invitation cancelled successfully', null);
  } catch (error) {
    next(error);
  }
};

const getPendingInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getPendingInvitations(req.user.email);
    return successResponse(res, 200, 'Pending invitations retrieved', { invitations });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getWorkspaceInvitations(req.workspace.id, req.currentUser);
    return successResponse(res, 200, 'Workspace invitations retrieved', { invitations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvitation,
  resendInvitation,
  validateToken,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getPendingInvitations,
  getWorkspaceInvitations
};
