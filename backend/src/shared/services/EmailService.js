const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

/**
 * Email Provider Adapter Interface
 * Allows swapping between Nodemailer, SendGrid, Resend, AWS SES seamlessly.
 */
class EmailProviderAdapter {
  async sendEmail({ to, subject, html, attachments }) {
    throw new Error('sendEmail must be implemented by adapter');
  }
}

/**
 * Nodemailer Implementation
 */
class NodemailerAdapter extends EmailProviderAdapter {
  constructor() {
    super();
    this.smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (this.smtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      logger.warn('SMTP credentials not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged but not sent.');
      this.transporter = null;
    }
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    if (!this.transporter || !this.smtpConfigured) {
      logger.info({ to, subject }, '[EmailService] SMTP not configured — email skipped (logged only). Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable delivery.');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"WeaverBird" <${process.env.SMTP_FROM || 'noreply@weaverbird.app'}>`,
        to,
        subject,
        html,
        attachments
      });
      logger.info({ messageId: info.messageId, to }, 'Email sent successfully via Nodemailer');
      return true;
    } catch (error) {
      logger.error({ error, to }, 'Failed to send email via Nodemailer');
      throw error;
    }
  }
}

/**
 * Email Service
 */
class EmailService {
  constructor(adapter) {
    // Inject the adapter dependency. Currently defaults to Nodemailer.
    this.provider = adapter || new NodemailerAdapter();
  }

  /**
   * Send an email with HTML template and optional attachments
   * 
   * @param {string} to 
   * @param {string} subject 
   * @param {string} html 
   * @param {Array<{filename: string, content: Buffer|string, path: string}>} attachments 
   */
  async send(to, subject, html, attachments = []) {
    return await this.provider.sendEmail({ to, subject, html, attachments });
  }
}

module.exports = new EmailService();

