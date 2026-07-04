/**
 * Feature Flag Service
 * Determines if a workspace has access to specific features.
 * In the future, this can be connected to Stripe subscriptions or custom overrides.
 */
class FeatureFlagService {
  /**
   * Check if a workspace has access to a specific feature.
   * 
   * @param {Object} workspace - The workspace object resolved from Firestore
   * @param {string} featureName - The name of the feature (e.g., 'emailReports')
   * @returns {boolean} - True if the feature is enabled
   */
  has(workspace, featureName) {
    if (!workspace) return false;

    const subscription = workspace.subscription || 'free';
    const flags = workspace.featureFlags || {};

    // If there is an explicit override in the database, respect it
    if (typeof flags[featureName] === 'boolean') {
      return flags[featureName];
    }

    // Default feature mapping by subscription tier
    const premiumFeatures = [
      'emailReports',
      'automation',
      'advancedReports',
      'aiAssistant',
      'whiteLabel',
      'clientPortal',
    ];

    if (subscription === 'premium' || subscription === 'enterprise') {
      return true; // Premium has access to all currently defined premium features
    }

    if (subscription === 'free') {
      return !premiumFeatures.includes(featureName);
    }

    return false;
  }
}

module.exports = new FeatureFlagService();
