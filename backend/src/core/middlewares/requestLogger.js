const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');

const requestLogger = pinoHttp({
  logger,
  genReqId: function (req, res) {
    const id = req.id || req.headers['x-request-id'] || uuidv4();
    return id;
  },
  customProps: function (req, res) {
    return {
      workspaceId: req.headers['x-workspace-id'] || null,
      userId: req.user ? req.user.uid : null, // If auth middleware sets req.user
    };
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

module.exports = requestLogger;
