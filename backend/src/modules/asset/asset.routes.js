const express = require('express');
const multer = require('multer');
const { uploadAsset, listAssets, getAsset, deleteAsset } = require('./asset.controller');
const { uploadAssetSchema, listAssetsSchema } = require('./asset.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

// Memory storage for multer (buffers in RAM) to allow passing to Sharp and StorageService
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Upload a new asset or a new version of an existing asset
 *     tags: [Asset]
 */
router.post(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECTS_CREATE), // Typically requires edit access
  upload.single('file'), // Multer middleware extracting the file part
  validateRequest(uploadAssetSchema),
  uploadAsset
);

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: List and search assets by metadata
 *     tags: [Asset]
 */
router.get(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECTS_READ),
  validateRequest(listAssetsSchema),
  listAssets
);

router.get(
  '/:assetId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECTS_READ),
  getAsset
);

router.delete(
  '/:assetId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECTS_DELETE),
  deleteAsset
);

module.exports = router;
