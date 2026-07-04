const projectRepo = require('./project.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');
const EventBus = require('../../shared/services/EventBus');
const TransactionService = require('../../shared/services/TransactionService');

class ProjectService {
  async listProjects(workspaceId, queryParams) {
    const { data, total } = await projectRepo.listProjects(workspaceId, queryParams);
    
    const page = parseInt(queryParams.page) || 1;
    const pageSize = parseInt(queryParams.pageSize) || 10;
    const hasNext = (page * pageSize) < total;

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        hasNext,
      }
    };
  }

  async getProject(workspaceId, projectId) {
    const project = await projectRepo.findById(workspaceId, projectId);
    if (!project) {
      throw new AppError('Project not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    return project;
  }

  async createProject(workspaceId, currentUser, projectData) {
    // Example of using TransactionService if we had multiple writes.
    // For single writes, we can just use the repository, but to demonstrate the standard:
    let createdProject = null;
    
    await TransactionService.runTransaction(async (transaction) => {
      // In a real transactional scenario, we'd pass `transaction` down to repo methods
      // For simplicity in this structure, we just wrap the atomic operations.
      createdProject = await projectRepo.create(workspaceId, {
        ...projectData,
        createdBy: currentUser.uid,
      });
    });

    // Publish lightweight Domain Event
    EventBus.publish('project.created', {
      workspaceId,
      projectId: createdProject.id,
      userId: currentUser.uid,
      projectName: createdProject.name,
      timestamp: new Date().toISOString()
    });

    return createdProject;
  }

  async updateProject(workspaceId, projectId, currentUser, updateData) {
    const project = await this.getProject(workspaceId, projectId);
    
    await projectRepo.update(workspaceId, projectId, updateData);

    EventBus.publish('project.updated', {
      workspaceId,
      projectId,
      userId: currentUser.uid,
      updates: Object.keys(updateData)
    });

    return { ...project, ...updateData };
  }

  async deleteProject(workspaceId, projectId, currentUser) {
    const project = await this.getProject(workspaceId, projectId);
    
    await projectRepo.delete(workspaceId, projectId, currentUser.uid);

    EventBus.publish('project.deleted', {
      workspaceId,
      projectId,
      userId: currentUser.uid,
    });

    return { success: true };
  }
}

module.exports = new ProjectService();
