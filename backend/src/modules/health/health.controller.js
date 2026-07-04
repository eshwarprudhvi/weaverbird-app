const { successResponse, errorResponse } = require('../../core/utils/responseFormatter');
const { db } = require('../../config/firebase');
const StorageService = require('../../shared/services/StorageService');

const getHealth = (req, res) => {
  return successResponse(res, 200, 'Service is healthy', {
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
};

const getDatabaseHealth = async (req, res) => {
  try {
    if (!db) throw new Error('Database instance is undefined');
    
    // Quick ping to Firestore to check connectivity
    // We can list collections or just return ok if db is configured
    const collections = await db.listCollections();
    
    return successResponse(res, 200, 'Database is healthy', {
      status: 'OK',
      collectionsCount: collections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, 503, 'Database is down', [error.message]);
  }
};

const getFirebaseHealth = (req, res) => {
  try {
    const { admin } = require('../../config/firebase');
    if (!admin.apps.length) throw new Error('Firebase app not initialized');

    return successResponse(res, 200, 'Firebase is healthy', {
      status: 'OK',
      appName: admin.app().name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, 503, 'Firebase is down', [error.message]);
  }
};

const getStorageHealth = async (req, res) => {
  try {
    if (!StorageService.bucket) throw new Error('Storage bucket not initialized');

    return successResponse(res, 200, 'Storage is healthy', {
      status: 'OK',
      bucketName: StorageService.bucket.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(res, 503, 'Storage is down', [error.message]);
  }
};

module.exports = {
  getHealth,
  getDatabaseHealth,
  getFirebaseHealth,
  getStorageHealth,
};
