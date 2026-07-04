const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const projectRoutes = require('./modules/project/project.routes');
const taskRoutes = require('./modules/task/task.routes');
const meetingRoutes = require('./modules/meeting/meeting.routes');
const reportRoutes = require('./modules/report/report.routes');
const assetRoutes = require('./modules/asset/asset.routes');
const integrationRoutes = require('./modules/integration/integration.routes');

// Initialize Event Subscribers
require('./shared/subscribers');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Built-in middleware for json and urlencoded payloads
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
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/integrations', integrationRoutes);

// 404 Handler
app.use((req, res, next) => {
  return errorResponse(res, 404, 'Endpoint not found', [
    { code: errorCodes.NOT_FOUND, message: `Route ${req.originalUrl} not found` },
  ]);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
