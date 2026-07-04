const express = require('express');
const {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('./task.controller');
const {
  listTasksSchema,
  createTaskSchema,
  updateTaskSchema
} = require('./task.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks (Paginated)
 *     tags: [Task]
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
 *         description: Successfully retrieved tasks
 */
router.get(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW), // Assuming task view is tied to project view currently
  validateRequest(listTasksSchema),
  listTasks
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get a specific task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: taskId
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully retrieved task
 */
router.get(
  '/:taskId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  getTask
);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Task]
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
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_CREATE),
  validateRequest(createTaskSchema),
  createTask
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   patch:
 *     summary: Update an existing task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: taskId
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
 *         description: Task updated successfully
 */
router.patch(
  '/:taskId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  validateRequest(updateTaskSchema),
  updateTask
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Soft delete a task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         required: true
 *       - in: path
 *         name: taskId
 *         required: true
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete(
  '/:taskId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.TASK_DELETE),
  deleteTask
);

module.exports = router;
