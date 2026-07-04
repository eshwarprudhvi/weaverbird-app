const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');

/**
 * Authorization Middleware Factory
 * Checks if the current user has the required permission.
 * Must be used AFTER requireWorkspace.
 * 
 * @param {string} requiredPermission - The permission string (e.g., 'projects:create')
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.currentUser) {
        throw new AppError('Current user abstraction not found. Ensure requireWorkspace is used.', 500, errorCodes.INTERNAL_SERVER_ERROR);
      }

      if (!req.currentUser.permissions.includes(requiredPermission)) {
        throw new AppError(
          `Permission denied. Missing required permission: ${requiredPermission}`,
          403,
          errorCodes.PERMISSION_DENIED
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = requirePermission;
