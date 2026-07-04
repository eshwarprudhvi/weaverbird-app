/**
 * Renders HTML string for a Studio Backup Report
 * @param {Object} data - The workspace and project data
 */
const renderBackupReport = (data) => {
  const { workspaceName, projects, generatedAt } = data;

  const projectRows = projects.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name || 'Unnamed'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.status || 'Active'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
          h1 { color: #111; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f9f9f9; text-align: left; padding: 12px; font-weight: 600; border-bottom: 2px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>${workspaceName} - Studio Backup</h1>
        <div class="meta">Generated: ${new Date(generatedAt).toLocaleString()}</div>
        
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows.length > 0 ? projectRows : '<tr><td colspan="3">No projects found.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

module.exports = {
  renderBackupReport,
};
