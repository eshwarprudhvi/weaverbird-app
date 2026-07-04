const reportRepo = require('./report.repository');
const PDFService = require('../../shared/services/PDFService');
const StorageService = require('../../shared/services/StorageService');
const EmailService = require('../../shared/services/EmailService');
const QueueService = require('../../shared/services/QueueService');
const EventBus = require('../../shared/services/EventBus');
const SearchService = require('../../shared/services/SearchService');
const { renderBackupReport } = require('./templates/renderers/reportRenderer');
const { renderReportEmail } = require('./templates/renderers/emailRenderer');
const logger = require('../../config/logger');

class ReportService {
  constructor() {
    // Register the worker process for report generation
    QueueService.registerWorker('report.generateBackup', this._processBackupReport.bind(this));
  }

  /**
   * Queues a manual backup report generation
   */
  async queueBackupReport(workspaceId, currentUser, requestData) {
    const { targetEmail } = requestData;

    // 1. Create job tracker in DB
    const job = await reportRepo.createJob(workspaceId, {
      type: 'backup',
      targetEmail,
      requestedBy: currentUser.uid,
    });

    // 2. Enqueue the job for async processing
    await QueueService.enqueue('report.generateBackup', {
      jobId: job.id,
      workspaceId,
      targetEmail,
      currentUser
    });

    // 3. Publish domain event
    EventBus.publish('report.queued', {
      jobId: job.id,
      type: 'backup',
      workspaceId,
      userId: currentUser.uid,
    });

    return job;
  }

  /**
   * Worker function to process the Backup Report (Executed asynchronously)
   */
  async _processBackupReport(payload) {
    const { jobId, workspaceId, targetEmail, currentUser } = payload;
    
    try {
      await reportRepo.updateJobStatus(workspaceId, jobId, { status: 'processing' });

      // 1. Gather Data (Fetch active projects)
      const projectData = await SearchService.search(`workspaces/${workspaceId}/projects`, {
        pageSize: 1000, // Large fetch for backup
        filters: { status: 'active' }
      });

      const reportData = {
        workspaceName: 'WeaverBird Workspace', // In a real scenario, fetch workspace details
        projects: projectData.data,
        generatedAt: new Date().toISOString(),
      };

      // 2. HTML Template
      const htmlContent = renderBackupReport(reportData);

      // 3. Puppeteer HTML to PDF
      const pdfBuffer = await PDFService.generateFromHtml(htmlContent);

      // 4. Upload to Storage (Temporary with expiry)
      const fileName = `reports/backup_${workspaceId}_${Date.now()}.pdf`;
      const downloadUrl = await StorageService.uploadBuffer(pdfBuffer, fileName, {
        contentType: 'application/pdf',
        metadata: { type: 'temporary_report' }
      });

      // 5. Render Email HTML
      const emailHtml = renderReportEmail({
        recipientName: 'Team Member',
        reportName: 'Studio Backup',
        workspaceName: 'WeaverBird Workspace',
        downloadUrl
      });

      // 6. Send Email via Provider
      await EmailService.send(
        targetEmail, 
        'Studio Backup Report - WeaverBird', 
        emailHtml
        // We provide a link instead of attachment for large backups, 
        // but could easily attach: attachments: [{ filename: 'backup.pdf', content: pdfBuffer }]
      );

      // 7. Update Job Status
      await reportRepo.updateJobStatus(workspaceId, jobId, { status: 'completed', downloadUrl });

      // 8. Publish Domain Event
      EventBus.publish('report.generated', {
        jobId,
        type: 'backup',
        workspaceId,
        userId: currentUser.uid,
      });

    } catch (error) {
      logger.error({ error, jobId }, 'Backup report generation failed');
      await reportRepo.updateJobStatus(workspaceId, jobId, { 
        status: 'failed', 
        error: error.message 
      });
      
      // Optionally notify someone it failed
      EventBus.publish('report.failed', {
        jobId,
        workspaceId,
      });
    }
  }
}

module.exports = new ReportService();
