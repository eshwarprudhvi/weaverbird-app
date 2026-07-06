const express = require('express');
const {
  listCatalog,
  getCatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem
} = require('./catalog.controller');
const {
  listCatalogSchema,
  createCatalogSchema,
  updateCatalogSchema
} = require('./catalog.validators');
const validateRequest = require('../../core/middlewares/validateRequest');
const requireAuth = require('../../core/middlewares/requireAuth');
const requireWorkspace = require('../../core/middlewares/requireWorkspace');
const requirePermission = require('../../core/middlewares/requirePermission');
const { PERMISSIONS } = require('../../core/rbac/roles');

const router = express.Router();

router.get(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW), // Assuming same permission as project view for catalog view
  validateRequest(listCatalogSchema),
  listCatalog
);

router.get(
  '/:itemId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  getCatalogItem
);

router.post(
  '/',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_CREATE), // Creating catalog items requires project create/edit permission
  validateRequest(createCatalogSchema),
  createCatalogItem
);

router.patch(
  '/:itemId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validateRequest(updateCatalogSchema),
  updateCatalogItem
);

router.delete(
  '/:itemId',
  requireAuth,
  requireWorkspace,
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  deleteCatalogItem
);

module.exports = router;
