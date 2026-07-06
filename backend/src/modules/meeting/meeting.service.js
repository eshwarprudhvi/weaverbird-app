const meetingRepo = require('./meeting.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');
const EventBus = require('../../shared/services/EventBus');
const TransactionService = require('../../shared/services/TransactionService');

class MeetingService {
  async listMeetings(workspaceId, queryParams) {
    const { data, total } = await meetingRepo.listMeetings(workspaceId, queryParams);
    
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

  async getMeeting(workspaceId, meetingId) {
    let meeting = await meetingRepo.findById(workspaceId, meetingId);
    if (!meeting) {
      // Try tempId lookup
      meeting = await meetingRepo.findByTempId(workspaceId, meetingId);
    }
    if (!meeting) {
      throw new AppError('Meeting not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    return meeting;
  }

  async createMeeting(workspaceId, currentUser, meetingData) {
    let createdMeeting = null;
    
    await TransactionService.runTransaction(async (transaction) => {
      createdMeeting = await meetingRepo.create(workspaceId, {
        ...meetingData,
        createdBy: currentUser.uid,
      });
    });

    EventBus.publish('meeting.scheduled', {
      workspaceId,
      meetingId: createdMeeting.id,
      projectId: meetingData.projectId,
      userId: currentUser.uid,
      title: createdMeeting.title,
    });

    return createdMeeting;
  }

  async updateMeeting(workspaceId, meetingId, currentUser, updateData) {
    const meeting = await this.getMeeting(workspaceId, meetingId);
    
    await meetingRepo.update(workspaceId, meeting.id, updateData);

    EventBus.publish('meeting.updated', {
      workspaceId,
      meetingId: meeting.id,
      userId: currentUser.uid,
      updates: Object.keys(updateData)
    });

    return { ...meeting, ...updateData };
  }

  async deleteMeeting(workspaceId, meetingId, currentUser) {
    const meeting = await this.getMeeting(workspaceId, meetingId);
    
    await meetingRepo.delete(workspaceId, meeting.id, currentUser.uid);

    EventBus.publish('meeting.deleted', {
      workspaceId,
      meetingId: meeting.id,
      projectId: meeting.projectId,
      userId: currentUser.uid,
    });

    return { success: true };
  }
}

module.exports = new MeetingService();
