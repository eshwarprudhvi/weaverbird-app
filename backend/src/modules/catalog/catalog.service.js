const catalogRepo = require('./catalog.repository');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');
const EventBus = require('../../shared/services/EventBus');

class CatalogService {
  async listCatalog(workspaceId) {
    const items = await catalogRepo.listCatalog(workspaceId);
    return { data: items };
  }

  async getCatalogItem(workspaceId, itemId) {
    const item = await catalogRepo.findById(workspaceId, itemId);
    if (!item) {
      throw new AppError('Catalog item not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    return item;
  }

  async createCatalogItem(workspaceId, currentUser, itemData) {
    const created = await catalogRepo.create(workspaceId, {
      ...itemData,
      createdBy: currentUser.uid,
      ownerUid: itemData.ownerUid || currentUser.uid,
    });

    EventBus.publish('catalog.created', {
      workspaceId,
      itemId: created.id,
      userId: currentUser.uid,
      name: created.name,
    });

    return created;
  }

  async updateCatalogItem(workspaceId, itemId, currentUser, updateData) {
    const item = await this.getCatalogItem(workspaceId, itemId);
    
    await catalogRepo.update(workspaceId, itemId, updateData);

    EventBus.publish('catalog.updated', {
      workspaceId,
      itemId,
      userId: currentUser.uid,
      updates: Object.keys(updateData)
    });

    return { ...item, ...updateData };
  }

  async deleteCatalogItem(workspaceId, itemId, currentUser) {
    await this.getCatalogItem(workspaceId, itemId);
    await catalogRepo.delete(workspaceId, itemId, currentUser.uid);

    EventBus.publish('catalog.deleted', {
      workspaceId,
      itemId,
      userId: currentUser.uid,
    });

    return { success: true };
  }
}

module.exports = new CatalogService();
