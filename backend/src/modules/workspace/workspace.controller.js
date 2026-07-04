const workspaceService = require('./workspace.service');
const { successResponse } = require('../../core/utils/responseFormatter');

const getProfile = async (req, res, next) => {
  try {
    const profile = await workspaceService.getWorkspaceProfile(req.workspace.id);
    return successResponse(res, 200, 'Workspace profile retrieved successfully', { profile });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await workspaceService.updateWorkspaceProfile(req.workspace.id, req.body);
    return successResponse(res, 200, 'Workspace profile updated successfully', { profile: updatedProfile });
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await workspaceService.getMembers(req.workspace.id);
    return successResponse(res, 200, 'Workspace members retrieved successfully', { members });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMembers,
};
