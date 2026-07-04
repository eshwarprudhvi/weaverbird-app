const express = require('express');
const { getMe, getDebug } = require('./auth.controller');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');

const router = express.Router();

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully returned user info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, getMe);

/**
 * @swagger
 * /auth/debug:
 *   get:
 *     summary: Debug identity and workspace resolution
 *     tags: [Auth]
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
 *         description: Successfully resolved
 */
router.get('/debug', requireAuth, requireWorkspace, getDebug);

module.exports = router;
