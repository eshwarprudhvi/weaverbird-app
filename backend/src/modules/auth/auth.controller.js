const { successResponse } = require('../../core/utils/responseFormatter');
const workspaceIndexRepo = require('../member/workspaceIndex.repository');

const getMe = async (req, res, next) => {
  try {
    let workspaceIndex = null;
    try {
      workspaceIndex = await workspaceIndexRepo.findByUid(req.user.uid);
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
  getMe,
  getDebug,
};
