const { db } = require('../../config/firebase');
const SearchService = require('../../shared/services/SearchService');

class ProjectRepository {
  /**
   * Retrieves a paginated list of projects
   */
  async listProjects(workspaceId, { page = 1, pageSize = 10, sort = 'createdAt', order = 'desc', search = '', status = '' }) {
    const filters = {};
    if (status) filters.status = status;

    return await SearchService.search(`workspaces/${workspaceId}/projects`, {
      page,
      pageSize,
      sort,
      order,
      search,
      filters,
      searchFields: ['name', 'description'],
    });
  }

  async findById(workspaceId, projectId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('projects')
      .doc(projectId)
      .get();
      
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.status === 'deleted') return null;
    
    return { id: doc.id, ...data };
  }

  async create(workspaceId, projectData) {
    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('projects')
      .add({
        ...projectData,
        status: projectData.status || 'active',
        createdAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...projectData };
  }

  async update(workspaceId, projectId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('projects')
      .doc(projectId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }

  /**
   * Implements soft delete policy
   */
  async delete(workspaceId, projectId, deletedByUserId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('projects')
      .doc(projectId)
      .update({
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: deletedByUserId,
      });
  }
}

module.exports = new ProjectRepository();
