const assetService = require('./asset.service');
const { successResponse } = require('../../core/utils/responseFormatter');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

const uploadAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400, errorCodes.VALIDATION_ERROR);
    }

    const asset = await assetService.uploadAsset(
      req.workspace.id,
      req.currentUser,
      req.file,
      req.body // Metadata mapped from multipart body
    );

    return successResponse(res, 201, 'Asset uploaded successfully', asset);
  } catch (error) {
    next(error);
  }
};

const listAssets = async (req, res, next) => {
  try {
    const { data, meta } = await assetService.listAssets(req.workspace.id, req.query);
    return successResponse(res, 200, 'Assets retrieved successfully', data, meta);
  } catch (error) {
    next(error);
  }
};

const getAsset = async (req, res, next) => {
  try {
    const asset = await assetService.getAsset(req.workspace.id, req.params.assetId);
    return successResponse(res, 200, 'Asset retrieved successfully', asset);
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.workspace.id, req.params.assetId, req.currentUser);
    return successResponse(res, 200, 'Asset deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAsset,
  listAssets,
  getAsset,
  deleteAsset,
};
