const logger = require('../../config/logger');
const { errorResponse } = require('../utils/responseFormatter');
const errorCodes = require('../errors/errorCodes');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || errorCodes.INTERNAL_SERVER_ERROR;

  const errorObj = {
    code,
    message: err.isOperational ? err.message : 'An unexpected error occurred',
  };

  if (err.name === 'ZodError') {
    errorObj.code = errorCodes.VALIDATION_ERROR;
    errorObj.message = 'Validation failed';
    errorObj.details = err.errors; // Zod specific errors
  }

  return errorResponse(res, statusCode, message, errorObj);
};

module.exports = errorHandler;
