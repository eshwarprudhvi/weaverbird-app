/**
 * Standard API Response Formatter
 */

exports.successResponse = (res, statusCode, message, data = {}, meta = {}) => {
  const req = res.req;
  const workspaceId = req.workspace?.id || req.headers?.['x-workspace-id'] || null;
  const mergedMeta = {
    workspaceId,
    timestamp: new Date().toISOString(),
    apiVersion: 2,
    ...meta
  };
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: mergedMeta,
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
