const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const FeatureFlagService = require('../../shared/services/FeatureFlagService');

/**
 * Authorization Middleware Factory for Features
 * Checks if the current workspace has access to the required feature.
 * Must be used AFTER requireWorkspace.
 * 
 * @param {string} featureName - The feature string (e.g., 'emailReports')
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    try {
      if (!req.workspace) {
        throw new AppError('Workspace not found. Ensure requireWorkspace is used.', 500, errorCodes.INTERNAL_SERVER_ERROR);
      }

      const hasFeature = FeatureFlagService.has(req.workspace, featureName);
      if (!hasFeature) {
        throw new AppError(
          `Upgrade required. Your workspace subscription does not support: ${featureName}`,
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

module.exports = requireFeature;
