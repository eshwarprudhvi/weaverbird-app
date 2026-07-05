const express = require('express');
const { 
  acceptInvitation, 
  declineInvitation, 
  cancelInvitation, 
  getPendingInvitations, 
  getWorkspaceInvitations 
} = require('./invitation.controller');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');

const router = express.Router();

/**
 * @swagger
 * /invitations/pending:
 *   get:
 *     summary: Get pending invitations for the authenticated user
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pending', requireAuth, getPendingInvitations);

/**
 * @swagger
 * /invitations/accept:
 *   post:
 *     summary: Accept an invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/accept', requireAuth, acceptInvitation);

/**
 * @swagger
 * /invitations/decline:
 *   post:
 *     summary: Decline an invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/decline', requireAuth, declineInvitation);

/**
 * @swagger
 * /invitations/{invitationId}/cancel:
 *   post:
 *     summary: Cancel a pending invitation (Owner only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:invitationId/cancel', requireAuth, requireWorkspace, cancelInvitation);

/**
 * @swagger
 * /invitations/workspace:
 *   get:
 *     summary: Get all invitations for the active workspace
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workspace', requireAuth, requireWorkspace, getWorkspaceInvitations);

module.exports = router;
