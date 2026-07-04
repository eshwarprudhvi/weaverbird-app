const express = require('express');
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('./project.controller');
const {
  listProjectsSchema,
  createProjectSchema,
  updateProjectSchema
} = require('./project.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List projects (Paginated)
 *     tags: [Project]
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
 *     responses:
 *       200:
 *         description: Successfully retrieved projects
 */
router.get(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  validateRequest(listProjectsSchema),
  listProjects
);

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: Get a specific project
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: projectId
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully retrieved project
 */
router.get(
  '/:projectId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  getProject
);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Project]
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
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  validateRequest(createProjectSchema),
  createProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   patch:
 *     summary: Update an existing project
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: projectId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.patch(
  '/:projectId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validateRequest(updateProjectSchema),
  updateProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Soft delete a project
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: projectId
 *         required: true
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete(
  '/:projectId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  deleteProject
);

module.exports = router;
