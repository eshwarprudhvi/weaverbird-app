const EventBus = require('../services/EventBus');
const logger = require('../../config/logger');
const EmailService = require('../services/EmailService');
const { renderInvitationEmail } = require('../../modules/report/templates/renderers/emailRenderer');

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
    try {
      const invitation = payload?.invitation || payload;
      if (!invitation || !invitation.email) {
        logger.warn('Invitation email aborted: missing email in payload');
        return;
      }

      const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitations/accept?token=${invitation.token}`;
      const html = renderInvitationEmail({
        recipientEmail: invitation.email,
        workspaceName: invitation.workspaceId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        message: invitation.message,
        acceptUrl,
        expiresAt: invitation.expiresAt
      });

      const subject = payload?.resent
        ? `[Reminder] You've been invited to collaborate on WeaverBird Studio`
        : `You've been invited to join a workspace on WeaverBird Studio`;

      await EmailService.send(invitation.email, subject, html);
      logger.info({ email: invitation.email }, 'Invitation email dispatched successfully');
    } catch (err) {
      logger.error({ err, email: payload?.invitation?.email }, 'Failed to dispatch invitation email via EmailService');
    }
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
