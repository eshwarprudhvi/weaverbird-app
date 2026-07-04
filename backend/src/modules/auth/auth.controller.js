const { successResponse } = require('../../core/utils/responseFormatter');

const getMe = (req, res) => {
  // req.user is populated by requireAuth middleware
  return successResponse(res, 200, 'Authenticated successfully', {
    user: {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.email_verified,
      name: req.user.name,
      picture: req.user.picture,
    },
  });
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
