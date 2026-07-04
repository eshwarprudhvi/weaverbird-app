const express = require('express');
const { getProfile, updateProfile, getMembers } = require('./workspace.controller');
const { updateWorkspaceSchema } = require('./workspace.validators');
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
