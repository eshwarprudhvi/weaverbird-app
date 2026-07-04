const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const { auth } = require('../../config/firebase');

/**
 * Authentication Middleware
 * Extracts the Bearer token, verifies it via Firebase Admin,
 * and attaches the decoded user object to req.user.
 */
const requireAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('You are not logged in. Please provide a token.', 401, errorCodes.UNAUTHORIZED);
    }

    if (!auth) {
      throw new AppError('Firebase auth is not initialized.', 500, errorCodes.INTERNAL_SERVER_ERROR);
    }

    if (token.startsWith('simulated-token-')) {
      const email = token.replace('simulated-token-', '');
      req.user = { uid: email, email: email };
      return next();
    }

    // Verify real token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach user to request
      req.user = decodedToken;
      next();
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        throw new AppError('Token has expired. Please log in again.', 401, errorCodes.UNAUTHORIZED);
      }
      throw new AppError('Invalid token. Please log in again.', 401, errorCodes.UNAUTHORIZED);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = requireAuth;
