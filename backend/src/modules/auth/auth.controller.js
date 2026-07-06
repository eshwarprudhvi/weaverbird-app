const { successResponse } = require('../../core/utils/responseFormatter');
const workspaceIndexRepo = require('../member/workspaceIndex.repository');
const workspaceRepo = require('../workspace/workspace.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');

const registerWorkspace = async (req, res, next) => {
  try {
    const { companyName, businessCategory, country } = req.body;
    
    if (!companyName) {
      throw new AppError('Company name is required', 400, errorCodes.VALIDATION_ERROR);
    }

    // 1. Create Workspace
    const workspaceId = await workspaceRepo.create({
      companyName,
      businessCategory: businessCategory || '',
      country: country || '',
    });

    // 2. Add creator as Owner in workspace members
    await workspaceRepo.addMember(workspaceId, req.user.uid, {
      email: req.user.email,
      name: req.user.name || '',
      role: 'owner',
      status: 'active'
    });

    // 3. Set the global workspace index for this user
    await workspaceIndexRepo.setIndex(req.user.uid, workspaceId, 'active', 'owner');

    return successResponse(res, 201, 'Workspace created successfully', {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        role: 'owner'
      },
      activeWorkspaceId: workspaceId
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    let workspaceIndex = null;
    try {
      workspaceIndex = await workspaceIndexRepo.findByUid(req.user.uid);
      if (workspaceIndex && workspaceIndex.workspaceId) {
        const ws = await workspaceRepo.findById(workspaceIndex.workspaceId);
        if (!ws) {
          console.warn(`Workspace ${workspaceIndex.workspaceId} not found, cleaning up index for UID ${req.user.uid}`);
          await workspaceIndexRepo.removeIndex(req.user.uid);
          workspaceIndex = null;
        }
      }
    } catch (firestoreError) {
      // Firestore may be unavailable (no service account key in local dev)
      console.warn('Firestore lookup failed for workspaceIndex:', firestoreError.message);
    }
    
    // req.user is populated by requireAuth middleware
    return successResponse(res, 200, 'Authenticated successfully', {
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.email_verified,
        name: req.user.name,
        picture: req.user.picture,
      },
      currentMembership: workspaceIndex // null if Firestore unavailable
    });
  } catch (error) {
    next(error);
  }
};

const getDebug = (req, res) => {
  return successResponse(res, 200, 'Identity and workspace resolved successfully', {
    currentUser: req.currentUser,
    workspace: req.workspace,
  });
};

module.exports = {
  registerWorkspace,
  getMe,
  getDebug,
};
