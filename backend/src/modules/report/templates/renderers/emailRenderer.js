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

/**
 * Renders HTML string for Team Invitation Emails
 * @param {Object} data
 */
const renderInvitationEmail = (data) => {
  const { recipientEmail, workspaceName, role, invitedBy, message, acceptUrl, expiresAt } = data;
  const formattedExpiry = expiresAt ? new Date(expiresAt).toLocaleDateString() : '7 days';

  return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }
          .container { padding: 30px; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { color: #1a1a1a; font-size: 22px; margin: 0; }
          .role-badge { display: inline-block; background-color: rgba(212, 175, 55, 0.15); color: #b89728; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
          .quote-box { background-color: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px 20px; margin: 20px 0; font-style: italic; color: #555; border-radius: 0 8px 8px 0; }
          .button { display: inline-block; padding: 14px 28px; background-color: #D4AF37; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 25px 0; text-align: center; }
          .button:hover { background-color: #b89728; }
          .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center; }
          .link-text { font-size: 12px; color: #888; word-break: break-all; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>WeaverBird Studio Workspace</h1>
          </div>
          <h2>You've been invited to collaborate!</h2>
          <p>Hello <strong>${recipientEmail}</strong>,</p>
          <p><strong>${invitedBy || 'A team member'}</strong> has invited you to join the workspace <strong>${workspaceName || 'Team Workspace'}</strong> as a <span class="role-badge">${role || 'Member'}</span>.</p>
          
          ${message ? `
          <div class="quote-box">
            "${message}"
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p style="font-size: 13px; color: #666;">
            If the button above does not work, copy and paste the following link into your browser:
          </p>
          <p class="link-text"><a href="${acceptUrl}">${acceptUrl}</a></p>
          
          <p style="margin-top: 25px; font-size: 13px; color: #d9534f; font-weight: 500;">
            ⏳ Note: For security reasons, this invitation expires on ${formattedExpiry}.
          </p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} WeaverBird Interior Studio. All rights reserved.<br/>
            If you did not expect this invitation, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  renderReportEmail,
  renderInvitationEmail,
};
