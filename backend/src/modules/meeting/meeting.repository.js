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

  async findByTempId(workspaceId, tempId) {
    let snap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .where('tempId', '==', tempId)
      .limit(1)
      .get();
      
    if (snap.empty && typeof tempId === 'string' && !isNaN(Number(tempId))) {
      snap = await db
        .collection('workspaces')
        .doc(workspaceId)
        .collection('meetings')
        .where('tempId', '==', Number(tempId))
        .limit(1)
        .get();
    }

    if (snap.empty && typeof tempId === 'string' && !tempId.startsWith('temp_')) {
      // Also try prepending 'temp_' just in case it was saved with 'temp_' prefix in DB
      snap = await db
        .collection('workspaces')
        .doc(workspaceId)
        .collection('meetings')
        .where('tempId', '==', `temp_${tempId}`)
        .limit(1)
        .get();
    }

    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data.status === 'deleted') return null;
    return { id: doc.id, ...data };
  }

  async create(workspaceId, meetingData) {
    if (meetingData.tempId) {
      const existing = await this.findByTempId(workspaceId, meetingData.tempId);
      if (existing) {
        return existing;
      }
    }

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
    const now = new Date().toISOString();
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('meetings')
      .doc(meetingId)
      .update({
        status: 'deleted',
        deletedAt: now,
        updatedAt: now,
        deletedBy: deletedByUserId,
      });
  }
}

module.exports = new MeetingRepository();
