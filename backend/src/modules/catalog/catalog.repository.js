const { db } = require('../../config/firebase');

class CatalogRepository {
  async findByTempId(workspaceId, tempId) {
    const snap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .where('tempId', '==', tempId)
      .limit(1)
      .get();
      
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async findById(workspaceId, itemId) {
    const doc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .doc(itemId)
      .get();
      
    if (!doc.exists) return null;
    const data = doc.data();
    if (data.status === 'deleted') return null;
    return { id: doc.id, ...data };
  }

  async listCatalog(workspaceId) {
    const snap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .where('status', '!=', 'deleted')
      .get();
      
    const items = [];
    snap.docs.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  }

  async create(workspaceId, data) {
    if (data.tempId) {
      const existing = await this.findByTempId(workspaceId, data.tempId);
      if (existing) {
        return existing;
      }
    }

    const docRef = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .add({
        ...data,
        status: data.status || 'active',
        visibility: data.visibility || 'workspace',
        createdAt: new Date().toISOString(),
      });
      
    return { id: docRef.id, ...data };
  }

  async update(workspaceId, itemId, data) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .doc(itemId)
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
  }

  async delete(workspaceId, itemId, userId) {
    await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('catalog')
      .doc(itemId)
      .update({
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      });
  }
}

module.exports = new CatalogRepository();
