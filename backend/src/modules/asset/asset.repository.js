const { db } = require('../../config/firebase');
const SearchService = require('../../shared/services/SearchService');

class AssetRepository {
  /**
   * Retrieves a paginated list of assets, searching by metadata instead of filename
   */
  async listAssets(workspaceId, { page = 1, pageSize = 10, sort = 'createdAt', order = 'desc', search = '', status = '', type = '', projectId = '' }) {
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (projectId) filters.projectId = projectId;

    return await SearchService.search(`workspaces/${workspaceId}/assets`, {
      page,
      pageSize,
      sort,
      order,
      search,
      filters,
      searchFields: ['title', 'description', 'tags'], // Search by metadata
    });
  }

  async findById(workspaceId, assetId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('assets')
      .doc(assetId)
      .get();
      
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.status === 'deleted') return null;
    
    return { id: doc.id, ...data };
  }

  /**
   * Creates a new Asset record
   */
  async create(workspaceId, assetData) {
    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('assets')
      .add({
        ...assetData,
        status: assetData.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...assetData };
  }

  /**
   * Updates an Asset record (e.g. adding a new version to the versions array)
   */
  async update(workspaceId, assetId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('assets')
      .doc(assetId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }

  /**
   * Soft deletes an Asset
   */
  async delete(workspaceId, assetId, deletedByUserId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('assets')
      .doc(assetId)
      .update({
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: deletedByUserId,
      });
  }
}

module.exports = new AssetRepository();
