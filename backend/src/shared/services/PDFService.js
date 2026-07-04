const puppeteer = require('puppeteer');
const logger = require('../../config/logger');

class PDFService {
  /**
   * Generates a PDF buffer from an HTML string
   * 
   * @param {string} htmlContent - The rendered HTML template
   * @param {Object} options - Puppeteer PDF options
   * @returns {Promise<Buffer>}
   */
  async generateFromHtml(htmlContent, options = {}) {
    let browser;
    try {
      // In production, configure executablePath or use puppeteer-core depending on environment (e.g. Cloud Run)
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // We set the content and wait for networkidle0 to ensure any external fonts/images are loaded
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Default PDF options matching standard reporting
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;

    } catch (error) {
      logger.error({ error }, 'Failed to generate PDF from HTML');
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = new PDFService();
