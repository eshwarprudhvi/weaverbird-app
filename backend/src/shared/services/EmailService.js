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
    // In production, these should be securely stored in process.env / config service
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
      }
    });
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"WeaverBird" <noreply@weaverbird.app>`,
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
