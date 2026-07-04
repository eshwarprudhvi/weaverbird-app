const taskService = require('./task.service');
const { successResponse, paginatedResponse } = require('../../core/utils/responseFormatter');

const listTasks = async (req, res, next) => {
  try {
    const result = await taskService.listTasks(req.workspace.id, req.query);
    return paginatedResponse(
      res, 
      'Tasks retrieved successfully', 
      result.data, 
      result.meta.page, 
      result.meta.pageSize, 
      result.meta.total, 
      result.meta.hasNext
    );
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTask(req.workspace.id, taskId);
    return successResponse(res, 200, 'Task retrieved successfully', { task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.workspace.id, req.currentUser, req.body);
    return successResponse(res, 201, 'Task created successfully', { task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.updateTask(req.workspace.id, taskId, req.currentUser, req.body);
    return successResponse(res, 200, 'Task updated successfully', { task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    await taskService.deleteTask(req.workspace.id, taskId, req.currentUser);
    return successResponse(res, 200, 'Task deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
