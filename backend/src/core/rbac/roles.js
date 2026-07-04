/**
 * Centralized Permission Registry
 * Do not hardcode permission strings anywhere else.
 */
const PERMISSIONS = {
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  
  PROJECT_VIEW: 'projects:view',
  PROJECT_CREATE: 'projects:create',
  PROJECT_UPDATE: 'projects:update',
  PROJECT_DELETE: 'projects:delete',
  
  TASK_CREATE: 'tasks:create',
  TASK_UPDATE: 'tasks:update',
  TASK_DELETE: 'tasks:delete',
  
  MEMBER_VIEW: 'members:view',
  MEMBER_INVITE: 'members:invite',
  MEMBER_REMOVE: 'members:remove',
  
  REPORT_VIEW: 'reports:view',
  REPORT_GENERATE: 'reports:generate',
  
  EMAIL_SEND: 'emails:send',
  
  BACKUP_CREATE: 'backups:create',
  BACKUP_RESTORE: 'backups:restore',
};

const ROLES = {
  OWNER: 'Workspace Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS), // Owner has all permissions
  
  [ROLES.ADMIN]: [
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.BACKUP_CREATE,
    PERMISSIONS.BACKUP_RESTORE,
  ],

  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.EMAIL_SEND,
  ],

  [ROLES.EDITOR]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
};

/**
 * Get all permissions for a given role name
 */
const getPermissionsForRole = (roleName) => {
  return ROLE_PERMISSIONS[roleName] || [];
};

module.exports = {
  PERMISSIONS,
  ROLES,
  getPermissionsForRole,
};
