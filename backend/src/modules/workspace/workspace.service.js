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

  async inviteMember(workspaceId, inviterUser, email, role) {
    // Basic invitation logic. In the future, this would send an email and 
    // potentially resolve if the user already has an account.
    const invitationId = await workspaceRepo.createInvitation(workspaceId, {
      email,
      role,
      invitedBy: inviterUser.uid,
    });
    
    return { invitationId, email, role };
  }

  async updateMemberRole(workspaceId, targetUserId, newRole) {
    const member = await workspaceRepo.getMember(workspaceId, targetUserId);
    if (!member) {
      throw new AppError('Member not found in workspace', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    
    await workspaceRepo.updateMember(workspaceId, targetUserId, { role: newRole });
    return { ...member, role: newRole };
  }

  async removeMember(workspaceId, targetUserId, removedByUserId) {
    const member = await workspaceRepo.getMember(workspaceId, targetUserId);
    if (!member) {
      throw new AppError('Member not found in workspace', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    
    await workspaceRepo.deleteMember(workspaceId, targetUserId, removedByUserId);
    return { success: true };
  }
}

module.exports = new WorkspaceService();
