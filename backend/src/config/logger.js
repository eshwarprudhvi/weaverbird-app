const pino = require('pino');
const config = require('./index');

const logger = pino({
  level: config.logging.level,
  transport: config.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  base: {
    env: config.env,
  },
});

module.exports = logger;
