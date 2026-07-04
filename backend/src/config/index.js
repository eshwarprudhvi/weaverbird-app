require('dotenv').config();

/**
 * Centralized Configuration Service
 * Avoid accessing process.env directly in the codebase.
 */

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  email: {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
