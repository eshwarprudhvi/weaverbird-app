const express = require('express');
const {
  getHealth,
  getDatabaseHealth,
  getFirebaseHealth,
  getStorageHealth,
} = require('./health.controller');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Base health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', getHealth);

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database is down
 */
router.get('/database', getDatabaseHealth);

/**
 * @swagger
 * /health/firebase:
 *   get:
 *     summary: Firebase Admin SDK health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Firebase is healthy
 *       503:
 *         description: Firebase is down
 */
router.get('/firebase', getFirebaseHealth);

/**
 * @swagger
 * /health/storage:
 *   get:
 *     summary: Storage bucket health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Storage is healthy
 *       503:
 *         description: Storage is down
 */
router.get('/storage', getStorageHealth);

module.exports = router;
