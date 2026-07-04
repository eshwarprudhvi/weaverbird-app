const admin = require('firebase-admin');
const config = require('./index');

const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

let db = null;
let authService = null;

try {
  // If we have explicit credentials in the environment
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
  } else {
    // Fallback to Application Default Credentials (e.g. running on Cloud Run)
    admin.initializeApp();
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
