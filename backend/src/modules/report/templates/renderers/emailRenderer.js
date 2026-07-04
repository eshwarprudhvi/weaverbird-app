/**
 * Renders HTML string for Email Templates
 * @param {Object} data 
 */
const renderReportEmail = (data) => {
  const { recipientName, reportName, workspaceName, downloadUrl } = data;

  return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { padding: 20px; max-width: 600px; margin: 0 auto; }
          .button { display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 40px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Your Report is Ready</h2>
          <p>Hello ${recipientName || ''},</p>
          <p>The <strong>${reportName}</strong> for <strong>${workspaceName}</strong> has been generated successfully.</p>
          
          <a href="${downloadUrl}" class="button">Download Report (PDF)</a>
          
          <p style="margin-top: 20px; font-size: 13px; color: #666;">
            Note: For security reasons, this download link will expire in 7 days.
          </p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} WeaverBird Interior Studio
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  renderReportEmail,
};
