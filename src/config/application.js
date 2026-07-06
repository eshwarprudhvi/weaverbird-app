/**
 * Centralized Application Configuration
 * 
 * NOTE: Application branding always comes from this file.
 * Workspace branding always comes dynamically from WorkspaceContext.
 * Never mix the two!
 */

export const APPLICATION = {
  name: "Apex Studio",
  shortName: "AS",
  version: "1.0.0",
  supportEmail: "eshwarprudhvi2005@gmail.com",
  website: "https://apexstudio.app",

  features: {
    selfRegistration: true, // Feature flag: when false, onboarding shows "Coming Soon" completion screen
    googleAuth: true,
    offlineMode: true,
  },

  storageKeys: {
    userEmail: "weaverbird_user_email",       // Retained for backwards compatibility during migration
    userRole: "weaverbird_user_role",         // Retained for backwards compatibility
    cloudSync: "weaverbird_cloud_sync",       // Retained for backwards compatibility
    workspaceCache: "weaverbird_workspace_cache", // Retained for backwards compatibility
    activeWorkspaceId: "wb_active_workspace_id",
  }
};
