const workspaceRepo = require('./workspace.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

class WorkspaceService {
  async getWorkspaceProfile(workspaceId) {
    const workspace = await workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', 404, errorCodes.WORKSPACE_NOT_FOUND);
    }
    return workspace;
  }

  async updateWorkspaceProfile(workspaceId, updateData) {
    // We assume validation is done by the controller/zod
    await workspaceRepo.update(workspaceId, updateData);
    return this.getWorkspaceProfile(workspaceId);
  }

  async getMembers(workspaceId) {
    return workspaceRepo.getMembers(workspaceId);
  }
}

module.exports = new WorkspaceService();
