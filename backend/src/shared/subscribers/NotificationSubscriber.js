const EventBus = require('../services/EventBus');
const logger = require('../../config/logger');

class NotificationSubscriber {
  constructor() {
    this.registerListeners();
  }

  registerListeners() {
    EventBus.subscribe('project.created', this.handleProjectCreated);
    EventBus.subscribe('task.assigned', this.handleTaskAssigned);
    EventBus.subscribe('meeting.scheduled', this.handleMeetingScheduled);
    EventBus.subscribe('invitation.created', this.handleInvitationCreated);
    EventBus.subscribe('invitation.accepted', this.handleInvitationAccepted);
    EventBus.subscribe('invitation.declined', this.handleInvitationDeclined);
    EventBus.subscribe('invitation.expired', this.handleInvitationExpired);
    EventBus.subscribe('member.created', this.handleMemberCreated);
  }

  async handleProjectCreated(payload) {
    logger.info({ payload }, 'Notification: Sending project created notification');
  }

  async handleTaskAssigned(payload) {
    logger.info({ payload }, 'Notification: Sending task assigned notification');
  }

  async handleMeetingScheduled(payload) {
    logger.info({ payload }, 'Notification: Sending meeting scheduled notification');
  }

  async handleInvitationCreated(payload) {
    logger.info({ payload }, 'Notification: Sending invitation email to recipient');
  }

  async handleInvitationAccepted(payload) {
    logger.info({ payload }, 'Notification: Sending invitation accepted notification to owner');
  }

  async handleInvitationDeclined(payload) {
    logger.info({ payload }, 'Notification: Sending invitation declined notification to owner');
  }

  async handleInvitationExpired(payload) {
    logger.info({ payload }, 'Notification: Sending invitation expired notification to owner');
  }

  async handleMemberCreated(payload) {
    logger.info({ payload }, 'Notification: Sending welcome notification to new workspace member');
  }
}

module.exports = new NotificationSubscriber();
