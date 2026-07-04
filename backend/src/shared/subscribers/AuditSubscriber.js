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
  }

  async handleProjectCreated(payload) {
    // Future: Write to 'audits' collection
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
}

module.exports = new AuditSubscriber();
