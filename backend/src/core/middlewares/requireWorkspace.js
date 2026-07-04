const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const workspaceRepo = require('../../modules/workspace/workspace.repository');
const { getPermissionsForRole } = require('../rbac/roles');

/**
 * Workspace Resolution Middleware
 * Must be used AFTER requireAuth.
 * Resolves active Workspace, verifies membership, and attaches currentUser.
 */
const requireWorkspace = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      throw new AppError('Authentication required before resolving workspace.', 401, errorCodes.UNAUTHORIZED);
    }

    const workspaceId = req.headers['x-workspace-id'];
    if (!workspaceId) {
      throw new AppError('Workspace ID is required in headers (x-workspace-id).', 400, errorCodes.VALIDATION_ERROR);
    }

    // Resolve Workspace
    const workspace = await workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace does not exist.', 404, errorCodes.WORKSPACE_NOT_FOUND);
    }
    
    // Check if workspace is inactive or suspended (future proofing)
    if (workspace.status === 'inactive') {
      throw new AppError('Workspace is inactive.', 403, errorCodes.PERMISSION_DENIED);
    }

    // Check Membership
    const member = await workspaceRepo.getMember(workspaceId, req.user.uid);
    if (!member) {
      throw new AppError('You are not a member of this workspace.', 403, errorCodes.PERMISSION_DENIED);
    }

    // Check if user is inactive in this workspace
    if (member.status === 'inactive') {
      throw new AppError('Your account is inactive in this workspace.', 403, errorCodes.PERMISSION_DENIED);
    }

    // Attach workspace to request
    req.workspace = workspace;

    // Attach normalized currentUser abstraction
    const role = member.role || 'Viewer';
    req.currentUser = {
      uid: req.user.uid,
      email: req.user.email,
      workspaceId,
      role,
      permissions: getPermissionsForRole(role),
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireWorkspace;
