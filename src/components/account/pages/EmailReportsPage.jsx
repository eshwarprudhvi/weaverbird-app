import React from 'react';
import { ChevronLeft, Mail, Send } from 'lucide-react';
import { updateWorkspaceSettings } from '../../../api/workspace.api';

const EmailReportsPage = ({ 
  onBack, 
  recipientEmail, setRecipientEmail, 
  backupRecipients = [], setBackupRecipients, 
  handleEmailReportManually, isSendingEmail,
  handleSendManualBackup, newRecipientInput, setNewRecipientInput,
  customRecipientEmail, setCustomRecipientEmail,
  db 
}) => {
  return (
    <div className="screen-content fade-in" style={{ padding: '0 0 80px 0', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'var(--bg-nav-solid)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', marginRight: '16px' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>Email Reports</h2>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Send Manual Report */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={16} color="var(--accent-gold)" /> Send Studio Backup
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Instantly generate and send a PDF report of all active projects.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13.5px", outline: "none", width: "100%" }}
            >
              <option value="">Select Recipient...</option>
              {backupRecipients.map((email, idx) => (
                <option key={idx} value={email}>{email}</option>
              ))}
              <option value="custom">Enter Custom Email...</option>
            </select>
            {recipientEmail === "custom" && (
              <input 
                type="email"
                placeholder="Enter email address"
                value={customRecipientEmail}
                onChange={(e) => setCustomRecipientEmail(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13.5px", outline: "none", width: "100%" }}
              />
            )}
            <button
              onClick={() => {
                if (recipientEmail === "custom") {
                  if (!customRecipientEmail) { alert("Enter a custom email"); return; }
                  handleSendManualBackup(customRecipientEmail);
                } else {
                  if (!recipientEmail) { alert("Select a recipient first."); return; }
                  handleSendManualBackup(recipientEmail);
                }
              }}
              disabled={isSendingEmail}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: isSendingEmail ? "var(--text-muted)" : "var(--accent-gold-dark)",
                color: "white",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: isSendingEmail ? "default" : "pointer",
                marginTop: "4px"
              }}
            >
              {isSendingEmail ? "Generating PDF & Sending..." : "Send Manual Backup Now"}
            </button>
          </div>
        </div>

        {/* Mailing List Directory */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "12px", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mailing List Directory ({backupRecipients.length})
          </label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input
              type="email"
              placeholder="new.recipient@company.com"
              value={newRecipientInput}
              onChange={(e) => setNewRecipientInput(e.target.value)}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-main)", fontSize: "13.5px", outline: "none" }}
            />
            <button
              onClick={async () => {
                const val = newRecipientInput?.toLowerCase()?.trim();
                if (!val || !val.includes("@")) { alert("Please enter a valid email"); return; }
                if (backupRecipients.includes(val)) { alert("Email already in list"); return; }
                const newList = [...backupRecipients, val];
                setBackupRecipients(newList);
                setNewRecipientInput("");
                try {
                  await updateWorkspaceSettings(localStorage.getItem('wb_active_workspace_id'), { 
                    backup_recipients: newList 
                  });
                } catch (err) { alert("Failed to save recipient to cloud"); }
              }}
              style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "var(--text-title)", color: "var(--bg-app)", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Add
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {backupRecipients.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>No recipients in directory.</div>
            )}
            {backupRecipients.map((email, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13.5px", color: "var(--text-main)" }}>{email}</span>
                <button
                  onClick={async () => {
                    const newList = backupRecipients.filter(e => e !== email);
                    setBackupRecipients(newList);
                    if (recipientEmail === email) setRecipientEmail("");
                    try {
                      await updateWorkspaceSettings(localStorage.getItem('wb_active_workspace_id'), { 
                        backup_recipients: newList 
                      });
                    } catch (err) { alert("Failed to remove recipient from cloud"); }
                  }}
                  style={{ padding: "4px 8px", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmailReportsPage;
