const express = require('express');
const { generateBackup } = require('./report.controller');
const { generateBackupSchema } = require('./report.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

/**
 * @swagger
 * /reports/projects/backup:
 *   post:
 *     summary: Queue a manual Studio Backup Report
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetEmail:
 *                 type: string
 *     responses:
 *       202:
 *         description: Report queued successfully
 */
router.post(
  '/projects/backup',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE), // Must be workspace admin/owner to generate backups
  validateRequest(generateBackupSchema),
  generateBackup
);

module.exports = router;
