

/**
 * Workspace Storage Service
 * 
 * Owns all browser storage.
 * No component, hook, or service may access localStorage/sessionStorage directly.
 */
class WorkspaceStorageService {
  constructor() {
    this.CURRENT_VERSION = 2; // v2 is the scoped workspace model
  }

  /**
   * Retrieves the fully qualified storage key based on workspace ID and entity.
   */
  _getKey(workspaceId, entity) {
    if (!workspaceId) {
      return `workspace_offline_${entity}`;
    }
    return `workspace_${workspaceId}_${entity}`;
  }

  getItem(workspaceId, entity) {
    const key = this._getKey(workspaceId, entity);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  setItem(workspaceId, entity, data) {
    const key = this._getKey(workspaceId, entity);
    localStorage.setItem(key, JSON.stringify(data));
  }

  removeItem(workspaceId, entity) {
    const key = this._getKey(workspaceId, entity);
    localStorage.removeItem(key);
  }

  // --- MIGRATION LOGIC ---

  getManifest() {
    const manifestStr = localStorage.getItem('workspace_storage_manifest');
    if (manifestStr) {
      return JSON.parse(manifestStr);
    }
    return { storageVersion: 1, migrated: false };
  }

  setManifest(manifest) {
    localStorage.setItem('workspace_storage_manifest', JSON.stringify(manifest));
  }

  /**
   * Called ONCE during bootstrap to migrate legacy `ipm_*` keys to `workspace_offline_*`
   * Only executes if storageVersion < CURRENT_VERSION.
   */
  async executeMigration() {
    const manifest = this.getManifest();
    
    if (manifest.storageVersion >= this.CURRENT_VERSION) {
      return; // Already migrated
    }

    console.log("WorkspaceStorageService: Executing atomic migration from v1 to v2...");
    
    try {
      // 1. Read legacy data
      const legacyProjects = localStorage.getItem("ipm_projects");
      const legacyRecentBackups = localStorage.getItem("ipm_projects_backups_recent");
      const legacyDailyBackups = localStorage.getItem("ipm_projects_backups_daily");
      const legacyDeletedIds = localStorage.getItem("ipm_deleted_project_ids");

      // 2. Validate & Write to scoped offline storage (atomically)
      if (legacyProjects) {
        this.setItem(null, "projects", JSON.parse(legacyProjects));
      }
      if (legacyRecentBackups) {
        this.setItem(null, "backups_recent", JSON.parse(legacyRecentBackups));
      }
      if (legacyDailyBackups) {
        this.setItem(null, "backups_daily", JSON.parse(legacyDailyBackups));
      }
      if (legacyDeletedIds) {
        this.setItem(null, "deleted_project_ids", JSON.parse(legacyDeletedIds));
      }

      // 3. Verify write (read back a key if it existed to ensure quota wasn't exceeded)
      if (legacyProjects) {
        const verified = this.getItem(null, "projects");
        if (!verified) throw new Error("Verification failed: projects not written.");
      }

      // 4. Update manifest
      const newManifest = {
        storageVersion: this.CURRENT_VERSION,
        migrated: true,
        migratedAt: new Date().toISOString()
      };
      this.setManifest(newManifest);

      // 5. Delete legacy keys ONLY after verified migration
      localStorage.removeItem("ipm_projects");
      localStorage.removeItem("ipm_projects_backups_recent");
      localStorage.removeItem("ipm_projects_backups_daily");
      localStorage.removeItem("ipm_deleted_project_ids");

      console.log("WorkspaceStorageService: Migration to v2 successful.");
    } catch (error) {
      console.error("WorkspaceStorageService: Migration failed. Legacy keys preserved.", error);
      // We do not delete legacy keys, so user data is safe. Next reload will retry.
    }
  }
}

export const workspaceStorageService = new WorkspaceStorageService();
