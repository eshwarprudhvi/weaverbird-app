const catalogService = require('./catalog.service');
const { successResponse } = require('../../core/utils/responseFormatter');

const listCatalog = async (req, res, next) => {
  try {
    const result = await catalogService.listCatalog(req.workspace.id);
    return successResponse(res, 200, 'Catalog items retrieved successfully', { items: result.data });
  } catch (error) {
    next(error);
  }
};

const getCatalogItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await catalogService.getCatalogItem(req.workspace.id, itemId);
    return successResponse(res, 200, 'Catalog item retrieved successfully', { item });
  } catch (error) {
    next(error);
  }
};

const createCatalogItem = async (req, res, next) => {
  try {
    const item = await catalogService.createCatalogItem(req.workspace.id, req.currentUser, req.body);
    return successResponse(res, 201, 'Catalog item created successfully', { item });
  } catch (error) {
    next(error);
  }
};

const updateCatalogItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await catalogService.updateCatalogItem(req.workspace.id, itemId, req.currentUser, req.body);
    return successResponse(res, 200, 'Catalog item updated successfully', { item });
  } catch (error) {
    next(error);
  }
};

const deleteCatalogItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    await catalogService.deleteCatalogItem(req.workspace.id, itemId, req.currentUser);
    return successResponse(res, 200, 'Catalog item deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCatalog,
  getCatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
};
