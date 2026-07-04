const { db } = require('../../config/firebase');

class ReportRepository {
  /**
   * Tracks a report generation job
   */
  async createJob(workspaceId, jobData) {
    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('reports')
      .add({
        ...jobData,
        status: 'queued', // queued, processing, completed, failed
        createdAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...jobData };
  }

  async updateJobStatus(workspaceId, reportId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('reports')
      .doc(reportId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }
}

module.exports = new ReportRepository();
