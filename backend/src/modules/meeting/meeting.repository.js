const { db } = require('../../config/firebase');
const SearchService = require('../../shared/services/SearchService');

class MeetingRepository {
  async listMeetings(workspaceId, { page = 1, pageSize = 10, sort = 'createdAt', order = 'desc', search = '', status = '', projectId = '' }) {
    const filters = {};
    if (status) filters.status = status;
    if (projectId) filters.projectId = projectId;

    return await SearchService.search(`workspaces/${workspaceId}/meetings`, {
      page,
      pageSize,
      sort,
      order,
      search,
      filters,
      searchFields: ['title', 'agenda'],
    });
  }

  async findById(workspaceId, meetingId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .doc(meetingId)
      .get();
      
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.status === 'deleted') return null;
    
    return { id: doc.id, ...data };
  }

  async create(workspaceId, meetingData) {
    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .add({
        ...meetingData,
        status: meetingData.status || 'scheduled',
        createdAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...meetingData };
  }

  async update(workspaceId, meetingId, updateData) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .doc(meetingId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
  }

  async delete(workspaceId, meetingId, deletedByUserId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .doc(meetingId)
      .update({
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: deletedByUserId,
      });
  }
}

module.exports = new MeetingRepository();
