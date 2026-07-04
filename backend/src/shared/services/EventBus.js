const EventEmitter = require('events');
const logger = require('../../config/logger');

/**
 * Internal Domain Event Bus
 * 
 * Used for lightweight decoupled communication between domains.
 * Example: 'project.created' -> Audit Service, Analytics Service
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners if the app grows significantly
    this.setMaxListeners(20);
  }

  /**
   * Publish a domain event
   * 
   * @param {string} eventName - e.g., 'project.created'
   * @param {Object} payload - The event payload
   */
  publish(eventName, payload) {
    logger.info({ eventName, payload }, `Domain event published: ${eventName}`);
    this.emit(eventName, payload);
  }

  /**
   * Subscribe to a domain event
   * 
   * @param {string} eventName 
   * @param {Function} handler 
   */
  subscribe(eventName, handler) {
    this.on(eventName, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error({ eventName, error }, `Error handling domain event: ${eventName}`);
      }
    });
  }
}

// Export as a singleton
module.exports = new EventBus();
