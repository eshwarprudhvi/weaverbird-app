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
  }

  async handleProjectCreated(payload) {
    // Future: Send email or push notification to workspace admins
    logger.info({ payload }, 'Notification: Sending project created notification');
  }

  async handleTaskAssigned(payload) {
    logger.info({ payload }, 'Notification: Sending task assigned notification');
  }

  async handleMeetingScheduled(payload) {
    logger.info({ payload }, 'Notification: Sending meeting scheduled notification');
  }
}

module.exports = new NotificationSubscriber();
