const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/config/logger');

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.env} mode`);
  logger.info(`Swagger docs available at http://localhost:${config.port}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});
