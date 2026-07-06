const logger = require('../../config/logger');
const { errorResponse } = require('../utils/responseFormatter');
const errorCodes = require('../errors/errorCodes');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || errorCodes.INTERNAL_SERVER_ERROR;

  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    code = errorCodes.VALIDATION_ERROR;
  }

  const errorObj = {
    code,
    message: err.isOperational || err.name === 'ZodError' ? message : 'An unexpected error occurred',
  };

  if (err.name === 'ZodError') {
    errorObj.details = err.errors;
  }

  return errorResponse(res, statusCode, message, errorObj);
};

module.exports = errorHandler;
