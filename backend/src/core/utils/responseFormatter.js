/**
 * Standard API Response Formatter
 */

exports.successResponse = (res, statusCode, message, data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    errors: null,
  });
};

exports.paginatedResponse = (res, message, data, page, pageSize, total, hasNext) => {
  return exports.successResponse(res, 200, message, data, {
    page,
    pageSize,
    total,
    hasNext,
  });
};

exports.errorResponse = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: Array.isArray(errors) ? errors : [errors],
  });
};
