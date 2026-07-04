import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export default function ReportPreviewModal({
  reportPreview,
  setReportPreview,
  formatDisplayDateStr,
  handleDownloadPDF,
  handleSharePDF,
  recipientEmail,
  setRecipientEmail,
  userEmail,
  backupRecipients,
  authorizedUsers,
  isSendingEmail,
  customRecipientEmail,
  setCustomRecipientEmail,
  emailJsServiceId,
  handleEmailReportManually
}) {
  const { workspace } = useWorkspace();
  const companyName = workspace?.companyName || "My Workspace";
  const studioName = workspace?.studioName || "Interior Studio";

  if (!reportPreview) return null;

  return (
<div
                  className="modal-overlay"
                  onClick={() => setReportPreview(null)}
                  style={{ zIndex: 2000 }}
                >
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{ padding: "24px 20px" }}
                  >
                    <div className="modal-header" style={{ marginBottom: "16px" }}>
                      <h3 style={{ textTransform: "uppercase", fontSize: "16px", letterSpacing: "1px" }}>
                        Report Preview
                      </h3>
                      <button
                        className="icon-btn"
                        onClick={() => setReportPreview(null)}
                        aria-label="Close Preview"
                        style={{ padding: "4px" }}
                      >
                        <ArrowLeft size={20} />
                      </button>
                    </div>

                    <div
                      className="report-preview-box"
                      style={{
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        padding: "20px",
                        color: "var(--text-main)",
                        maxHeight: "350px",
                        overflowY: "auto",
                        marginBottom: "20px"
                      }}
                    >
                      <div style={{ borderBottom: "2px solid var(--accent-gold)", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ fontFamily: "var(--font-title)", fontSize: "20px", fontWeight: "800", color: "var(--text-title)" }}>{companyName}</div>
                          <div style={{ fontFamily: "var(--font-title)", fontSize: "10px", fontWeight: "600", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "2px" }}>{studioName}</div>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                          <strong>Date:</strong> {new Date().toLocaleDateString("en-GB")}
                        </div>
                      </div>

                      <div style={{ backgroundColor: "rgba(0, 0, 0, 0.02)", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                        <div style={{ marginBottom: "4px" }}><strong>Project:</strong> {reportPreview.projectName}</div>
                        <div><strong>Target Deadline:</strong> {reportPreview.targetDate ? formatDisplayDateStr(reportPreview.targetDate) : "No Date Set"}</div>
                      </div>

                      <h4 style={{ fontFamily: "var(--font-title)", fontSize: "14px", fontWeight: "700", marginBottom: "10px", color: "var(--text-title)", borderLeft: "3px solid var(--accent-gold)", paddingLeft: "8px" }}>
                        {reportPreview.title}
                      </h4>

                      {/* Content grouped by room */}
                      {(() => {
                        const materialsByRoom = {};
                        (reportPreview.materials || []).forEach(m => {
                          const rid = m.roomId || 'general';
                          if (!materialsByRoom[rid]) materialsByRoom[rid] = [];
                          materialsByRoom[rid].push(m);
                        });

                        const tasksByRoom = {};
                        (reportPreview.tasks || []).forEach(t => {
                          const rid = t.roomId || 'general';
                          if (!tasksByRoom[rid]) tasksByRoom[rid] = [];
                          tasksByRoom[rid].push(t);
                        });

                        const allRoomIds = [...new Set([...Object.keys(materialsByRoom), ...Object.keys(tasksByRoom)])];

                        if (allRoomIds.length === 0) {
                          return <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No pending items found.</div>;
                        }

                        return allRoomIds.map(roomId => {
                          let roomName = 'General / Unassigned';
                          if (roomId !== 'general') {
                            const r = (reportPreview.rooms || []).find(x => x.id === roomId);
                            if (r) roomName = r.name;
                          }

                          const rMaterials = materialsByRoom[roomId] || [];
                          const rTasks = tasksByRoom[roomId] || [];

                          return (
                            <div key={roomId} style={{ marginBottom: "20px", padding: "12px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                              <h5 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800", color: "var(--accent-blue)", borderBottom: "2px solid var(--border-hover)", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {roomName}
                              </h5>

                              {(reportPreview.type === "materials" || reportPreview.type === "both") && rMaterials.length > 0 && (
                                <div style={{ marginBottom: "12px" }}>
                                  <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Materials</div>
                                  {rMaterials.map((m, idx) => (
                                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
                                      <span>â€¢ {m.name}</span>
                                      <span style={{ color: m.completed ? "#22c55e" : "var(--text-muted)", fontWeight: "600" }}>
                                        {m.completed ? "Completed" : "Pending"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {(reportPreview.type === "tasks" || reportPreview.type === "both") && rTasks.length > 0 && (
                                <div>
                                  <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Works</div>
                                  {rTasks.map((t, idx) => (
                                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
                                      <span>â€¢ {t.name}</span>
                                      <span style={{
                                        textTransform: "uppercase",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        color: t.completed ? "#22c55e" : t.priority === "high" ? "#ef4444" : t.priority === "medium" ? "#f97316" : "#3b82f6"
                                      }}>{t.completed ? "COMPLETED" : (t.priority || "medium")}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <button
                        className="btn-primary"
                        onClick={handleDownloadPDF}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "14px",
                          backgroundColor: "var(--accent-gold)",
                          color: "white",
                          border: "none",
                          borderRadius: "12px",
                          fontWeight: "700",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        Download PDF Report
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={handleSharePDF}
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "transparent",
                          color: "var(--text-main)",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                      >
                        Share PDF Report
                      </button>

                      {/* Email PDF Section */}
                      <div style={{
                        marginTop: "12px",
                        borderTop: "1px dashed var(--border)",
                        paddingTop: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                          Email PDF Report to Partner
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <select
                              value={recipientEmail}
                              onChange={(e) => setRecipientEmail(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "13px"
                              }}
                            >
                              {userEmail && <option value={userEmail.toLowerCase().trim()}>Myself ({userEmail})</option>}

                              {/* Custom backupRecipients list */}
                              {backupRecipients.map(email => (
                                <option key={email} value={email}>{email} (Recipient)</option>
                              ))}

                              {/* Other partners */}
                              {authorizedUsers.map(u => u.email.toLowerCase().trim())
                                .filter(email => email !== userEmail.toLowerCase().trim() && !backupRecipients.includes(email))
                                .map(email => (
                                  <option key={email} value={email}>{email} (Partner)</option>
                                ))
                              }

                              <option value="custom">Other Email...</option>
                            </select>

                            <button
                              onClick={handleEmailReportManually}
                              disabled={isSendingEmail}
                              style={{
                                width: "100%",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                padding: "10px 16px",
                                backgroundColor: isSendingEmail ? "var(--border)" : "var(--accent-gold)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "13px",
                                cursor: isSendingEmail ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "0 4px 10px rgba(212, 175, 55, 0.15)"
                              }}
                              onMouseEnter={(e) => {
                                if (!isSendingEmail) {
                                  e.currentTarget.style.backgroundColor = "var(--accent-gold-dark)";
                                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(212, 175, 55, 0.25)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSendingEmail) {
                                  e.currentTarget.style.backgroundColor = "var(--accent-gold)";
                                  e.currentTarget.style.boxShadow = "0 4px 10px rgba(212, 175, 55, 0.15)";
                                }
                              }}
                            >
                              {isSendingEmail ? (
                                <>
                                  <div className="spinner-mini" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Mail size={13} />
                                  <span>Send</span>
                                </>
                              )}
                            </button>
                          </div>

                          {recipientEmail === "custom" && (
                            <input
                              type="email"
                              placeholder="partner@example.com"
                              value={customRecipientEmail}
                              onChange={(e) => setCustomRecipientEmail(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "13px"
                              }}
                            />
                          )}
                        </div>
                        {!(import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId) && (
                          <span style={{ fontSize: "11px", color: "#ef4444" }}>
                            âš ï¸ Email service is not configured in the application environment (.env).
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
  );
}
