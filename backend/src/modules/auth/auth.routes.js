const express = require('express');
const { getMe, getDebug, registerWorkspace } = require('./auth.controller');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');

const router = express.Router();

/**
 * @swagger
 * /auth/register-workspace:
 *   post:
 *     summary: Register a new workspace and become the owner
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered workspace
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/register-workspace', requireAuth, registerWorkspace);

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
