const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const requestLogger = require('./core/middlewares/requestLogger');
const errorHandler = require('./core/middlewares/errorHandler');
const { errorResponse } = require('./core/utils/responseFormatter');
const errorCodes = require('./core/errors/errorCodes');

// Routes
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const workspaceRoutes = require('./modules/workspace/workspace.routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeaverBird Backend API',
      version: '1.0.0',
      description: 'API documentation for WeaverBird Interior Studio',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API Routes mounting
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspace', workspaceRoutes);

// 404 Handler
app.use((req, res, next) => {
  return errorResponse(res, 404, 'Endpoint not found', [
    { code: errorCodes.NOT_FOUND, message: `Route ${req.originalUrl} not found` },
  ]);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
