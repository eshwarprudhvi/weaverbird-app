const { admin } = require('../../config/firebase');
const { getStorage } = require('firebase-admin/storage');
const logger = require('../../config/logger');

/**
 * Storage Service Abstraction
 * Wraps Firebase Storage to allow future migration to S3/GCS directly.
 */
class StorageService {
  constructor() {
    // Only init if admin apps exist
    if (admin && admin.apps && admin.apps.length > 0) {
      this.bucket = getStorage().bucket();
    }
  }

  async uploadFile(filePath, destination, options = {}) {
    try {
      if (!this.bucket) throw new Error('Storage bucket not initialized');
      
      const [file] = await this.bucket.upload(filePath, {
        destination,
        ...options
      });
      
      return file.publicUrl();
    } catch (error) {
      logger.error('Failed to upload file:', error);
      throw error;
    }
  }

  async generateSignedUrl(filePath, expiresInHours = 1) {
    try {
      if (!this.bucket) throw new Error('Storage bucket not initialized');
      
      const file = this.bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInHours * 60 * 60 * 1000,
      });
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      if (!this.bucket) throw new Error('Storage bucket not initialized');
      
      await this.bucket.file(filePath).delete();
      return true;
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();
