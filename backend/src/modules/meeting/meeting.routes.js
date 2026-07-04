const express = require('express');
const {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('./meeting.controller');
const {
  listMeetingsSchema,
  createMeetingSchema,
  updateMeetingSchema
} = require('./meeting.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

/**
 * @swagger
 * /meetings:
 *   get:
 *     summary: List meetings (Paginated)
 *     tags: [Meeting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved meetings
 */
router.get(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW), // Using project view permission for now
  validateRequest(listMeetingsSchema),
  listMeetings
);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   get:
 *     summary: Get a specific meeting
 *     tags: [Meeting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: meetingId
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully retrieved meeting
 */
router.get(
  '/:meetingId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  getMeeting
);

/**
 * @swagger
 * /meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meeting]
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
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created successfully
 */
router.post(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_CREATE), // Re-using Task creation permission or Project for MVP
  validateRequest(createMeetingSchema),
  createMeeting
);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   patch:
 *     summary: Update an existing meeting
 *     tags: [Meeting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: meetingId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 */
router.patch(
  '/:meetingId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  validateRequest(updateMeetingSchema),
  updateMeeting
);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   delete:
 *     summary: Soft delete a meeting
 *     tags: [Meeting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: meetingId
 *         required: true
 *     responses:
 *       200:
 *         description: Meeting deleted successfully
 */
router.delete(
  '/:meetingId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_DELETE),
  deleteMeeting
);

module.exports = router;
