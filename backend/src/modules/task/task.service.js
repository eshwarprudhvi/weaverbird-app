const taskRepo = require('./task.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');
const EventBus = require('../../shared/services/EventBus');
const TransactionService = require('../../shared/services/TransactionService');

class TaskService {
  async listTasks(workspaceId, queryParams) {
    const { data, total } = await taskRepo.listTasks(workspaceId, queryParams);
    
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

  async getTask(workspaceId, taskId) {
    const task = await taskRepo.findById(workspaceId, taskId);
    if (!task) {
      throw new AppError('Task not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    return task;
  }

  async createTask(workspaceId, currentUser, taskData) {
    let createdTask = null;
    
    await TransactionService.runTransaction(async (transaction) => {
      createdTask = await taskRepo.create(workspaceId, {
        ...taskData,
        createdBy: currentUser.uid,
      });
    });

    EventBus.publish('task.created', {
      workspaceId,
      taskId: createdTask.id,
      projectId: taskData.projectId,
      userId: currentUser.uid,
      title: createdTask.title,
    });

    if (taskData.assigneeId) {
      EventBus.publish('task.assigned', {
        workspaceId,
        taskId: createdTask.id,
        assigneeId: taskData.assigneeId,
        userId: currentUser.uid,
      });
    }

    return createdTask;
  }

  async updateTask(workspaceId, taskId, currentUser, updateData) {
    const task = await this.getTask(workspaceId, taskId);
    
    await taskRepo.update(workspaceId, taskId, updateData);

    EventBus.publish('task.updated', {
      workspaceId,
      taskId,
      userId: currentUser.uid,
      updates: Object.keys(updateData)
    });

    if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
      EventBus.publish('task.assigned', {
        workspaceId,
        taskId,
        assigneeId: updateData.assigneeId,
        userId: currentUser.uid,
      });
    }

    return { ...task, ...updateData };
  }

  async deleteTask(workspaceId, taskId, currentUser) {
    const task = await this.getTask(workspaceId, taskId);
    
    await taskRepo.delete(workspaceId, taskId, currentUser.uid);

    EventBus.publish('task.deleted', {
      workspaceId,
      taskId,
      projectId: task.projectId,
      userId: currentUser.uid,
    });

    return { success: true };
  }
}

module.exports = new TaskService();
