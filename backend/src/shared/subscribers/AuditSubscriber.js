const EventBus = require('../services/EventBus');
const logger = require('../../config/logger');

class AuditSubscriber {
  constructor() {
    this.registerListeners();
  }

  registerListeners() {
    EventBus.subscribe('project.created', this.handleProjectCreated);
    EventBus.subscribe('project.updated', this.handleProjectUpdated);
    EventBus.subscribe('project.deleted', this.handleProjectDeleted);
    EventBus.subscribe('task.created', this.handleTaskCreated);
    EventBus.subscribe('task.deleted', this.handleTaskDeleted);
    EventBus.subscribe('meeting.created', this.handleMeetingCreated);
    EventBus.subscribe('report.generated', this.handleReportGenerated);
    EventBus.subscribe('asset.uploaded', this.handleAssetUploaded);
    EventBus.subscribe('asset.versioned', this.handleAssetVersioned);
    EventBus.subscribe('asset.deleted', this.handleAssetDeleted);
    EventBus.subscribe('invitation.created', this.handleInvitationCreated);
    EventBus.subscribe('invitation.accepted', this.handleInvitationAccepted);
    EventBus.subscribe('invitation.declined', this.handleInvitationDeclined);
    EventBus.subscribe('invitation.cancelled', this.handleInvitationCancelled);
    EventBus.subscribe('invitation.expired', this.handleInvitationExpired);
    EventBus.subscribe('member.created', this.handleMemberCreated);
  }

  async handleProjectCreated(payload) {
    logger.info({ payload }, 'Audit: Project created');
  }

  async handleProjectUpdated(payload) {
    logger.info({ payload }, 'Audit: Project updated');
  }

  async handleProjectDeleted(payload) {
    logger.info({ payload }, 'Audit: Project deleted');
  }

  async handleTaskCreated(payload) {
    logger.info({ payload }, 'Audit: Task created');
  }

  async handleTaskDeleted(payload) {
    logger.info({ payload }, 'Audit: Task deleted');
  }

  async handleMeetingCreated(payload) {
    logger.info({ payload }, 'Audit: Meeting created');
  }

  async handleReportGenerated(payload) {
    logger.info({ payload }, 'Audit: Report generated');
  }

  async handleAssetUploaded(payload) {
    logger.info({ payload }, 'Audit: Asset uploaded');
  }

  async handleAssetVersioned(payload) {
    logger.info({ payload }, 'Audit: Asset versioned');
  }

  async handleAssetDeleted(payload) {
    logger.info({ payload }, 'Audit: Asset deleted');
  }

  async handleInvitationCreated(payload) {
    logger.info({ payload }, 'Audit: Invitation created');
  }

  async handleInvitationAccepted(payload) {
    logger.info({ payload }, 'Audit: Invitation accepted');
  }

  async handleInvitationDeclined(payload) {
    logger.info({ payload }, 'Audit: Invitation declined');
  }

  async handleInvitationCancelled(payload) {
    logger.info({ payload }, 'Audit: Invitation cancelled');
  }

  async handleInvitationExpired(payload) {
    logger.info({ payload }, 'Audit: Invitation expired');
  }

  async handleMemberCreated(payload) {
    logger.info({ payload }, 'Audit: Workspace member created');
  }
}

module.exports = new AuditSubscriber();
