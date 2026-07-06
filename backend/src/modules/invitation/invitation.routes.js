const express = require('express');
const {
  createInvitation,
  resendInvitation,
  validateToken,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getPendingInvitations,
  getWorkspaceInvitations
} = require('./invitation.controller');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const validateRequest = require('../../core/middlewares/validateRequest');
const {
  createInvitationSchema,
  tokenParamSchema,
  idParamSchema
} = require('./invitation.validators');

const router = express.Router();

// Public Token Validation Endpoint (No authentication required)
router.get('/token/:token', validateRequest(tokenParamSchema), validateToken);

// Standard REST Endpoints
router.post('/', requireAuth, requireWorkspace, validateRequest(createInvitationSchema), createInvitation);
router.get('/', requireAuth, requireWorkspace, getWorkspaceInvitations);
router.get('/my', requireAuth, getPendingInvitations);
router.post('/:id/accept', requireAuth, acceptInvitation);
router.post('/:id/decline', requireAuth, declineInvitation);
router.delete('/:id', requireAuth, requireWorkspace, cancelInvitation);
router.post('/:id/resend', requireAuth, requireWorkspace, resendInvitation);

// Backward-compatible Route Aliases
router.get('/pending', requireAuth, getPendingInvitations);
router.get('/workspace', requireAuth, requireWorkspace, getWorkspaceInvitations);
router.post('/accept', requireAuth, acceptInvitation);
router.post('/decline', requireAuth, declineInvitation);
router.post('/:invitationId/cancel', requireAuth, requireWorkspace, cancelInvitation);

module.exports = router;
