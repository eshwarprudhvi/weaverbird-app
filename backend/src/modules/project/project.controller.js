const projectService = require('./project.service');
const { successResponse, paginatedResponse } = require('../../core/utils/responseFormatter');

const listProjects = async (req, res, next) => {
  try {
    const result = await projectService.listProjects(req.workspace.id, req.query);
    return paginatedResponse(
      res, 
      'Projects retrieved successfully', 
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

const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await projectService.getProject(req.workspace.id, projectId);
    return successResponse(res, 200, 'Project retrieved successfully', { project });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.workspace.id, req.currentUser, req.body);
    return successResponse(res, 201, 'Project created successfully', { project });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await projectService.updateProject(req.workspace.id, projectId, req.currentUser, req.body);
    return successResponse(res, 200, 'Project updated successfully', { project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await projectService.deleteProject(req.workspace.id, projectId, req.currentUser);
    return successResponse(res, 200, 'Project deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
