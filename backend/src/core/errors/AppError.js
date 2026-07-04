class AppError extends Error {
  constructor(message, statusCode, code, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'WB000';
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
