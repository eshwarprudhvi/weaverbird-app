const meetingService = require('./meeting.service');
const { successResponse, paginatedResponse } = require('../../core/utils/responseFormatter');

const listMeetings = async (req, res, next) => {
  try {
    const result = await meetingService.listMeetings(req.workspace.id, req.query);
    return paginatedResponse(
      res, 
      'Meetings retrieved successfully', 
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

const getMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const meeting = await meetingService.getMeeting(req.workspace.id, meetingId);
    return successResponse(res, 200, 'Meeting retrieved successfully', { meeting });
  } catch (error) {
    next(error);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.createMeeting(req.workspace.id, req.currentUser, req.body);
    return successResponse(res, 201, 'Meeting created successfully', { meeting });
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const meeting = await meetingService.updateMeeting(req.workspace.id, meetingId, req.currentUser, req.body);
    return successResponse(res, 200, 'Meeting updated successfully', { meeting });
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    await meetingService.deleteMeeting(req.workspace.id, meetingId, req.currentUser);
    return successResponse(res, 200, 'Meeting deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
};
