const express = require('express');
const { getProfile, updateProfile, getMembers, inviteMember, updateMemberRole, removeMember } = require('./workspace.controller');
const { updateWorkspaceSchema, inviteMemberSchema, updateMemberRoleSchema } = require('./workspace.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const requireFeature = require('../../core/middlewares/requireFeature');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

/**
 * @swagger
 * /workspace/profile:
 *   get:
 *     summary: Get workspace profile
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved workspace profile
 */
router.get(
  '/profile',
  requireAuth,
  requireWorkspace,
  // We don't strictly require WORKSPACE_UPDATE to view the profile, any member can view it for the UI
  getProfile
);

/**
 * @swagger
 * /workspace/profile:
 *   patch:
 *     summary: Update workspace profile
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated workspace profile
 */
router.patch(
  '/profile',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validateRequest(updateWorkspaceSchema),
  updateProfile
);

/**
 * @swagger
 * /workspace/members:
 *   get:
 *     summary: Get all workspace members
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved members
 */
router.get(
  '/members',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  getMembers
);

/**
 * @swagger
 * /workspace/members/invite:
 *   post:
 *     summary: Invite a new member
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully invited
 */
router.post(
  '/members/invite',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  validateRequest(inviteMemberSchema),
  inviteMember
);

/**
 * @swagger
 * /workspace/members/{userId}/role:
 *   patch:
 *     summary: Update a member's role
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated role
 */
router.patch(
  '/members/:userId/role',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.MEMBER_UPDATE_ROLE),
  validateRequest(updateMemberRoleSchema),
  updateMemberRole
);

/**
 * @swagger
 * /workspace/members/{userId}:
 *   delete:
 *     summary: Remove a member
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully removed
 */
router.delete(
  '/members/:userId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
  removeMember
);

/**
 * @swagger
 * /workspace/reports/advanced:
 *   get:
 *     summary: Example endpoint protected by feature flag
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advanced reports
 */
router.get(
  '/reports/advanced',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  requireFeature('advancedReports'),
  (req, res) => res.json({ success: true, message: 'Advanced reports unlocked' })
);

module.exports = router;
