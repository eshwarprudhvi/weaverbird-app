const admin = require('firebase-admin');
const { cert, initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');
const config = require('./index');

let db = null;
let authService = null;

try {
  if (getApps().length === 0) {
    // Try loading service account key file first (most reliable)
    const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = require(keyPath);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      // Fallback to env vars
      initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
    } else {
      // Fallback to Application Default Credentials
      initializeApp({
        projectId: config.firebase.projectId || 'demo-project',
      });
    }
  }

  db = getFirestore();
  authService = getAuth();
  
  // Set Firestore settings if needed
  db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

module.exports = {
  admin,
  db,
  auth: authService,
};

