const { db } = require('../../config/firebase');
const SearchService = require('../../shared/services/SearchService');

class TaskRepository {
  async listTasks(workspaceId, { page = 1, pageSize = 10, sort = 'createdAt', order = 'desc', search = '', status = '', projectId = '' }) {
    const filters = {};
    if (status) filters.status = status;
    if (projectId) filters.projectId = projectId;

    return await SearchService.search(`workspaces/${workspaceId}/tasks`, {
      page,
      pageSize,
      sort,
      order,
      search,
      filters,
      searchFields: ['title', 'description'],
    });
  }

  async findById(workspaceId, taskId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('tasks')
      .doc(taskId)
      .get();
      
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.status === 'deleted') return null;
    
    return { id: doc.id, ...data };
  }

  async findByTempId(workspaceId, tempId) {
    const snap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('tasks')
      .where('tempId', '==', tempId)
      .limit(1)
      .get();
      
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async create(workspaceId, taskData) {
    if (taskData.tempId) {
      const existing = await this.findByTempId(workspaceId, taskData.tempId);
      if (existing) {
        return existing;
      }
    }

    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('tasks')
      .add({
        ...taskData,
        status: taskData.status || 'todo',
        createdAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...taskData };
  }

  async update(workspaceId, taskId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('tasks')
      .doc(taskId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }

  async delete(workspaceId, taskId, deletedByUserId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('tasks')
      .doc(taskId)
      .update({
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: deletedByUserId,
      });
  }
}

module.exports = new TaskRepository();
