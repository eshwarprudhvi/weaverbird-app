/**
 * Generic Base Repository Interface Contract
 */
export class IRepository {
  create(workspaceId, data) {
    throw new Error("Method 'create()' must be implemented.");
  }

  update(workspaceId, id, data) {
    throw new Error("Method 'update()' must be implemented.");
  }

  delete(workspaceId, id) {
    throw new Error("Method 'delete()' must be implemented.");
  }

  getById(workspaceId, id) {
    throw new Error("Method 'getById()' must be implemented.");
  }

  list(workspaceId, query) {
    throw new Error("Method 'list()' must be implemented.");
  }

  sync(workspaceId, items) {
    throw new Error("Method 'sync()' must be implemented.");
  }
}
