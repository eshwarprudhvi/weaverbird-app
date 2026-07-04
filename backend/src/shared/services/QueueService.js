const EventEmitter = require('events');
const logger = require('../../config/logger');

/**
 * Queue Service Abstraction
 * Simulates an async background queue using Node's EventEmitter.
 * In a real production environment on Cloud Run, this should be swapped with
 * Google Cloud Tasks, Pub/Sub, or a BullMQ Redis instance.
 */
class QueueService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
    this.on('process', this._handleProcess.bind(this));
  }

  /**
   * Register a worker for a specific queue topic
   * 
   * @param {string} topic 
   * @param {Function} processor - async function that processes the job payload
   */
  registerWorker(topic, processor) {
    if (!this.workers) this.workers = {};
    this.workers[topic] = processor;
    logger.info(`Worker registered for queue topic: ${topic}`);
  }

  /**
   * Enqueue a job to be processed asynchronously
   * 
   * @param {string} topic 
   * @param {Object} payload 
   */
  async enqueue(topic, payload) {
    logger.info({ topic, jobId: payload.jobId }, `Job enqueued for ${topic}`);
    // Emit 'process' asynchronously so it does not block the HTTP request cycle
    setImmediate(() => {
      this.emit('process', { topic, payload });
    });
  }

  async _handleProcess({ topic, payload }) {
    if (!this.workers || !this.workers[topic]) {
      logger.error(`No worker registered for topic: ${topic}`);
      return;
    }

    try {
      logger.info({ topic, jobId: payload.jobId }, `Processing job...`);
      await this.workers[topic](payload);
      logger.info({ topic, jobId: payload.jobId }, `Job processed successfully`);
    } catch (error) {
      logger.error({ error, topic, jobId: payload.jobId }, `Job processing failed`);
      // In a real queue like Cloud Tasks, this is where retry logic would happen.
    }
  }
}

module.exports = new QueueService();
