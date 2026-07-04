const reportService = require('./report.service');
const { successResponse } = require('../../core/utils/responseFormatter');

const generateBackup = async (req, res, next) => {
  try {
    const job = await reportService.queueBackupReport(req.workspace.id, req.currentUser, req.body);
    // Return 202 Accepted because the report generation is asynchronous
    return successResponse(res, 202, 'Backup report generation queued', { jobId: job.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBackup,
};
