const AppError = require('../errors/AppError');
const errorCodes = require('../errors/errorCodes');
const { ZodError } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // We will throw a ZodError, which will be caught by the global error handler
        next(error);
      } else {
        next(new AppError('Validation failed', 400, errorCodes.VALIDATION_ERROR));
      }
    }
  };
};

module.exports = validateRequest;
