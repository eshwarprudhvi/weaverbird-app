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

const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const invitation = await workspaceService.inviteMember(req.workspace.id, req.currentUser, email, role);
    return successResponse(res, 201, 'Member invited successfully', { invitation });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const member = await workspaceService.updateMemberRole(req.workspace.id, userId, role);
    return successResponse(res, 200, 'Member role updated successfully', { member });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await workspaceService.removeMember(req.workspace.id, userId, req.currentUser.uid);
    return successResponse(res, 200, 'Member removed successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};
