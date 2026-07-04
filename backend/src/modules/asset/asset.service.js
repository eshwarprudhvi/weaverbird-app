const sharp = require('sharp');
const crypto = require('crypto');
const assetRepo = require('./asset.repository');
const StorageService = require('../../shared/services/StorageService');
const EventBus = require('../../shared/services/EventBus');
const AppError = require('../../core/errors/AppError');
const errorCodes = require('../../core/errors/errorCodes');
const logger = require('../../config/logger');

class AssetService {
  async listAssets(workspaceId, queryParams) {
    const { data, total } = await assetRepo.listAssets(workspaceId, queryParams);
    
    const page = parseInt(queryParams.page) || 1;
    const pageSize = parseInt(queryParams.pageSize) || 10;
    const hasNext = (page * pageSize) < total;

    return {
      data,
      meta: { page, pageSize, total, hasNext }
    };
  }

  async getAsset(workspaceId, assetId) {
    const asset = await assetRepo.findById(workspaceId, assetId);
    if (!asset) {
      throw new AppError('Asset not found', 404, errorCodes.RESOURCE_NOT_FOUND);
    }
    // Refresh signed URLs if needed, but typically frontend fetches fresh ones 
    // or stores long-lived public URLs for non-sensitive assets.
    return asset;
  }

  /**
   * Generates a safe storage path
   */
  _generateStoragePath(workspaceId, originalName) {
    const ext = originalName.split('.').pop();
    const hash = crypto.randomBytes(8).toString('hex');
    return `workspaces/${workspaceId}/assets/${hash}.${ext}`;
  }

  /**
   * Uploads a new asset or a new version of an existing asset
   */
  async uploadAsset(workspaceId, currentUser, file, metadataBody) {
    const { title, description, tags, type, projectId, assetId } = metadataBody;
    
    let processedBuffer = file.buffer;
    let mimeType = file.mimetype;
    let size = file.size;
    let aiContext = { status: 'pending' }; // Placeholder for OCR/Embeddings

    // 1. Automatic Image Optimization
    if (mimeType.startsWith('image/')) {
      processedBuffer = await sharp(file.buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }) // Max dimension
        .jpeg({ quality: 80 }) // Auto convert/compress
        .toBuffer();
      
      mimeType = 'image/jpeg';
      size = processedBuffer.length;
    }

    // 2. Upload to Storage
    const storagePath = this._generateStoragePath(workspaceId, file.originalname);
    const downloadUrl = await StorageService.uploadBuffer(processedBuffer, storagePath, {
      contentType: mimeType,
      metadata: { uploadedBy: currentUser.uid }
    });

    // 3. Construct Version Object
    const newVersion = {
      versionId: crypto.randomBytes(4).toString('hex'),
      originalName: file.originalname,
      size,
      mimeType,
      storagePath,
      downloadUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.uid,
    };

    let asset;

    if (assetId) {
      // Versioning existing asset
      asset = await this.getAsset(workspaceId, assetId);
      const updatedVersions = [...(asset.versions || []), newVersion];
      
      await assetRepo.update(workspaceId, assetId, {
        versions: updatedVersions,
        // Update searchable metadata if provided
        title: title || asset.title,
        description: description || asset.description,
        tags: tags ? JSON.parse(tags) : asset.tags,
      });

      asset.versions = updatedVersions;

      EventBus.publish('asset.versioned', {
        workspaceId,
        assetId,
        versionId: newVersion.versionId,
        userId: currentUser.uid,
      });

    } else {
      // Creating new asset
      asset = await assetRepo.create(workspaceId, {
        title: title || file.originalname,
        description: description || '',
        type: type || 'document',
        projectId: projectId || null,
        tags: tags ? JSON.parse(tags) : [],
        aiContext,
        versions: [newVersion],
        createdBy: currentUser.uid,
      });

      EventBus.publish('asset.uploaded', {
        workspaceId,
        assetId: asset.id,
        type: asset.type,
        userId: currentUser.uid,
      });
    }

    // 4. (Future) Trigger AI indexing queue here: OCR text extraction, embeddings generation

    return asset;
  }

  async deleteAsset(workspaceId, assetId, currentUser) {
    const asset = await this.getAsset(workspaceId, assetId);
    
    await assetRepo.delete(workspaceId, assetId, currentUser.uid);

    EventBus.publish('asset.deleted', {
      workspaceId,
      assetId,
      userId: currentUser.uid,
    });

    return { success: true };
  }
}

module.exports = new AssetService();
