import React from "react";
import AddProjectModal from "../modals/AddProjectModal";
import AddMeetingModal from "../modals/AddMeetingModal";
import { Plus, CheckSquare, Clock, MapPin, X, Trash2, Edit2, FileText, Download, User, ArrowLeft, MoreHorizontal, Image, Camera, AlertCircle, Save, FolderPlus, Folder, MoreVertical, RefreshCw , Mail, Undo, RotateCcw } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { projectRepository } from "../../repositories/ProjectRepository";
import { useWorkspaceScope } from "../../application/session";

const CommonModals = (props) => {
  const { reportPreview, setReportPreview, formatDisplayDateStr, handleDownloadPDF, handleSharePDF, recipientEmail, setRecipientEmail, userEmail, backupRecipients, authorizedUsers, handleEmailReportManually, isSendingEmail, customRecipientEmail, setCustomRecipientEmail, emailJsServiceId, isTrashBinOpen, setIsTrashBinOpen, projects, userRole, setCustomConfirm, setProjects, setDeletedProjectIds, isBackupsListOpen, setIsBackupsListOpen, isRemoteChange, deletedProjectIds, syncProjectToCloud, isConfigured, db, cloudSyncEnabled, isAuthorized, deleteProject, doc, deleteProjectFromCloud, isNewProjModalOpen, setIsNewProjModalOpen, handleAddProject, isNewMeetingModalOpen, setIsNewMeetingModalOpen, handleAddMeeting, newMeetTitle, setNewMeetTitle, newMeetDate, setNewMeetDate, editItemModal, setEditItemModal, handleSaveEdit, customConfirm } = props;
  const { workspace } = useWorkspace();
  const scope = useWorkspaceScope();
  const safeProjects = Array.isArray(projects) ? projects : [];
  const companyName = workspace?.companyName || "My Workspace";
  const studioName = workspace?.studioName || "Interior Studio";
  
  return (
    <>
{/* --- MODALS --- */}

              {/* Report Preview Modal (In-App sheet to avoid freezing/loading bugs on phones) */}
              {reportPreview && (
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
                                      <span>• {m.name}</span>
                                      <span style={{ color: "var(--text-muted)" }}>Pending</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {(reportPreview.type === "tasks" || reportPreview.type === "both") && rTasks.length > 0 && (
                                <div>
                                  <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Works</div>
                                  {rTasks.map((t, idx) => (
                                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
                                      <span>• {t.name}</span>
                                      <span style={{
                                        textTransform: "uppercase",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        color: t.priority === "high" ? "#ef4444" : t.priority === "medium" ? "#f97316" : "#3b82f6"
                                      }}>{t.priority || "medium"}</span>
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
                            ⚠️ Email service is not configured in the application environment (.env).
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recycle Bin (Trash) Modal */}
              {isTrashBinOpen && (
                <div className="modal-overlay" onClick={() => setIsTrashBinOpen(false)} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "100%", borderRadius: "16px", padding: "24px", maxHeight: "85vh" }}>
                    <div className="modal-header" style={{ marginBottom: "20px" }}>
                      <h3>Recycle Bin (Trash)</h3>
                      <button className="icon-btn" onClick={() => setIsTrashBinOpen(false)}>
                        <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", padding: "8px 0" }}>
                      {safeProjects.filter(p => p.isTrashed).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                          <Trash2 size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                          <p style={{ fontSize: "14px" }}>Your Recycle Bin is empty.</p>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {userRole !== "admin" && userRole !== "owner" && (
                              <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                * Only Administrators can permanently empty trash.
                              </span>
                            )}
                            {(userRole === "admin" || userRole === "owner") && (
                              <button
                                onClick={() => {
                                  setCustomConfirm({
                                    title: "Empty Trash",
                                    message: "Are you sure you want to permanently delete all projects in the trash? This cannot be undone!",
                                    onConfirm: () => {
                                      const trashedProjects = safeProjects.filter(p => p.isTrashed);
                                      const trashedIds = trashedProjects.map(p => p.id);
                                      setProjects(prev => (Array.isArray(prev) ? prev : []).filter(p => !p.isTrashed));
                                      setDeletedProjectIds(prev => [...new Set([...(Array.isArray(prev) ? prev : []), ...trashedIds])]);
                                      if (scope && scope.workspaceId) {
                                        trashedProjects.forEach(p => {
                                          projectRepository.delete(scope.workspaceId, p.id)
                                            .catch(err => console.error("Failed to permanently delete project from trash:", err));
                                        });
                                      }
                                    }
                                  });
                                }}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginLeft: "auto"
                                }}
                              >
                                <Trash2 size={13} />
                                Empty Trash
                              </button>
                            )}
                          </div>

                          {safeProjects.filter(p => p.isTrashed).map((p) => (
                            <div key={p.id} style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: "1px solid var(--border)",
                              backgroundColor: "var(--bg-card)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px"
                            }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>{p.name}</span>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  Trashed on: {p.trashedAt ? new Date(p.trashedAt).toLocaleString() : "Unknown"}
                                </span>
                              </div>

                              <div style={{ display: "flex", gap: "8px" }}>
                                {/* Restore Button */}
                                <button
                                  onClick={() => {
                                    setCustomConfirm({
                                      title: "Restore Project",
                                      message: `Are you sure you want to restore the project "${p.name}"?`,
                                      onConfirm: () => {
                                        setProjects(prev =>
                                          (Array.isArray(prev) ? prev : []).map(proj =>
                                            proj.id === p.id ? { ...proj, isTrashed: false, trashedAt: null, status: 'active' } : proj
                                          )
                                        );
                                        if (scope && scope.workspaceId) {
                                          projectRepository.restore(scope.workspaceId, p.id)
                                            .catch(err => console.error("Failed to restore project from trash:", err));
                                        }
                                      }
                                    });
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                                    color: "#22c55e",
                                    border: "1px solid rgba(34, 197, 94, 0.2)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <Undo size={12} />
                                  Restore
                                </button>

                                {/* Delete Permanently Button - Admin/Owner Only */}
                                {(userRole === "admin" || userRole === "owner") && (
                                  <button
                                    onClick={() => {
                                      setCustomConfirm({
                                        title: "Permanently Delete Project",
                                        message: `Are you sure you want to permanently delete "${p.name}"? This cannot be undone!`,
                                        onConfirm: () => {
                                          setProjects(prev => (Array.isArray(prev) ? prev : []).filter(proj => proj.id !== p.id));
                                          setDeletedProjectIds(prev => [...new Set([...(Array.isArray(prev) ? prev : []), p.id])]);
                                          if (scope && scope.workspaceId) {
                                            projectRepository.delete(scope.workspaceId, p.id)
                                              .catch(err => console.error("Failed to permanently delete project:", err));
                                          }
                                        }
                                      });
                                    }}
                                    style={{
                                      padding: "6px 10px",
                                      backgroundColor: "transparent",
                                      color: "#ef4444",
                                      border: "1px solid rgba(239, 68, 68, 0.2)",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Local Backups Modal */}
              {isBackupsListOpen && (
                <div className="modal-overlay" onClick={() => setIsBackupsListOpen(false)} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "100%", borderRadius: "16px", padding: "24px", maxHeight: "85vh" }}>
                    <div className="modal-header" style={{ marginBottom: "20px" }}>
                      <h3>Local Backup Snapshots</h3>
                      <button className="icon-btn" onClick={() => setIsBackupsListOpen(false)}>
                        <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", padding: "8px 0" }}>
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                        The app saves backup snapshots of your projects locally before sync modifications are made. If you ever lose data, select a timestamped backup below to restore your projects state.
                      </p>

                      {userRole !== "admin" && (
                        <div style={{
                          padding: "10px 14px",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 500,
                          lineHeight: "1.4"
                        }}>
                          ⚠️ Admin-Only Action: You can view the backup history list, but only administrators can execute a restore.
                        </div>
                      )}

                      {(() => {
                        const savedRecentRaw = localStorage.getItem("ipm_projects_backups_recent");
                        const recentBackups = savedRecentRaw ? JSON.parse(savedRecentRaw) : [];

                        const savedDailyRaw = localStorage.getItem("ipm_projects_backups_daily");
                        const dailyBackups = savedDailyRaw ? JSON.parse(savedDailyRaw) : [];

                        if (recentBackups.length === 0 && dailyBackups.length === 0) {
                          return (
                            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                              <Clock size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                              <p style={{ fontSize: "14px" }}>No backup snapshots found yet.</p>
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Recent Section */}
                            {recentBackups.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  Recent Changes (Session Backup)
                                </h4>
                                {recentBackups.map((b, index) => (
                                  <div key={`recent-${index}`} style={{
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--bg-card)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px"
                                  }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                                      <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                                        {new Date(b.timestamp).toLocaleString()}
                                      </span>
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                        {b.projects.length} project(s)
                                      </span>
                                    </div>
                                    {(userRole === "admin" || userRole === "owner") ? (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to restore the backup from ${new Date(b.timestamp).toLocaleString()}?`)) {
                                            isRemoteChange.current = false;
                                            const restoredIds = b.projects.map(bp => bp.id);
                                            const updatedDeletedIds = deletedProjectIds.filter(id => !restoredIds.includes(id));
                                            setDeletedProjectIds(updatedDeletedIds);
                                            localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(updatedDeletedIds));
                                            localStorage.setItem("ipm_projects", JSON.stringify(b.projects));

                                            b.projects.forEach((proj) => {
                                              syncProjectToCloud(proj);
                                              if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail) {
                                                deleteProject(proj.id)
                                                  .catch(err => console.error("Failed to remove from deleted_projects:", err));
                                              }
                                            });
                                            safeProjects.forEach((proj) => {
                                              if (!b.projects.some(bp => bp.id === proj.id)) {
                                                deleteProjectFromCloud(proj.id);
                                              }
                                            });
                                            setProjects(b.projects);
                                            setIsBackupsListOpen(false);
                                            alert("Backup successfully restored!");
                                          }
                                        }}
                                        style={{
                                          padding: "6px 12px",
                                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                                          color: "var(--accent-gold)",
                                          border: "1px solid rgba(212, 175, 55, 0.2)",
                                          borderRadius: "8px",
                                          fontSize: "11.5px",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px"
                                        }}
                                      >
                                        <RotateCcw size={11} />
                                        Restore
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", border: "1px dashed var(--border)", padding: "4px 8px", borderRadius: "6px" }}>
                                        Admin Only
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Daily Section */}
                            {dailyBackups.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                                <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  Daily Checkpoints (Last 30 Days)
                                </h4>
                                {dailyBackups.map((b, index) => (
                                  <div key={`daily-${index}`} style={{
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--bg-card)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px"
                                  }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                                      <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                                        {new Date(b.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                      </span>
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                        Saved at {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.projects.length} project(s)
                                      </span>
                                    </div>
                                    {(userRole === "admin" || userRole === "owner") ? (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to restore the daily backup from ${new Date(b.timestamp).toLocaleDateString()}?`)) {
                                            isRemoteChange.current = false;
                                            const restoredIds = b.projects.map(bp => bp.id);
                                            const updatedDeletedIds = deletedProjectIds.filter(id => !restoredIds.includes(id));
                                            setDeletedProjectIds(updatedDeletedIds);
                                            localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(updatedDeletedIds));
                                            localStorage.setItem("ipm_projects", JSON.stringify(b.projects));

                                            b.projects.forEach((proj) => {
                                              syncProjectToCloud(proj);
                                              if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail) {
                                                deleteProject(proj.id)
                                                  .catch(err => console.error("Failed to remove from deleted_projects:", err));
                                              }
                                            });
                                            safeProjects.forEach((proj) => {
                                              if (!b.projects.some(bp => bp.id === proj.id)) {
                                                deleteProjectFromCloud(proj.id);
                                              }
                                            });
                                            setProjects(b.projects);
                                            setIsBackupsListOpen(false);
                                            alert("Daily backup successfully restored!");
                                          }
                                        }}
                                        style={{
                                          padding: "6px 12px",
                                          backgroundColor: "var(--accent-gold-dark)",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "8px",
                                          fontSize: "11.5px",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px"
                                        }}
                                      >
                                        <RotateCcw size={11} />
                                        Restore
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", border: "1px dashed var(--border)", padding: "4px 8px", borderRadius: "6px" }}>
                                        Admin Only
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Project Modal */}
              <AddProjectModal
                isOpen={isNewProjModalOpen}
                onClose={() => setIsNewProjModalOpen(false)}
                onAddProject={handleAddProject}
              />

              {/* Add Meeting/Schedule Modal */}
              {isNewMeetingModalOpen && (
                <div
                  className="modal-overlay"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                >
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h3>Schedule Sync Meeting</h3>
                      <button
                        className="icon-btn"
                        onClick={() => setIsNewMeetingModalOpen(false)}
                      >
                        <ArrowLeft
                          size={18}
                          style={{ transform: "rotate(-90deg)" }}
                        />
                      </button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMeetTitle.trim() || !newMeetDate) return;
                      handleAddMeeting({
                        id: Date.now().toString(),
                        title: newMeetTitle.trim(),
                        date: newMeetDate,
                        completed: false
                      });
                      setNewMeetTitle("");
                      setNewMeetDate("");
                    }}>
                      <div className="form-group">
                        <label>Meeting Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Supplier Review / Design Alignment"
                          value={newMeetTitle}
                          onChange={(e) => setNewMeetTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Meeting Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newMeetDate}
                          onChange={(e) => setNewMeetDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>

                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setIsNewMeetingModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Add Meeting
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {editItemModal && (
                <div
                  className="modal-overlay"
                  onClick={() => setEditItemModal(null)}
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
                >
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%", maxWidth: "360px", borderRadius: "16px", padding: "24px 20px", margin: "auto", maxHeight: "85vh", overflowY: "auto" }}
                  >
                    <div className="modal-header">
                      <h3>
                        {editItemModal.type === "new_room"
                          ? "Add New Room"
                          : editItemModal.type === "catalog_material"
                          ? "Edit Reference Material"
                          : `Edit ${editItemModal.type === "room" ? "Room" : editItemModal.type}`}
                      </h3>
                      <button
                        className="icon-btn"
                        onClick={() => setEditItemModal(null)}
                      >
                        <ArrowLeft
                          size={18}
                          style={{ transform: "rotate(-90deg)" }}
                        />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEdit}>
                      <div className="form-group">
                        <label>
                          {editItemModal.type === "meeting"
                            ? "Meeting Title"
                            : (editItemModal.type === "room" || editItemModal.type === "new_room")
                            ? "Room Name"
                            : editItemModal.type === "catalog_material"
                            ? "Material Name"
                            : "Name"}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editItemModal.name}
                          onChange={(e) =>
                            setEditItemModal({
                              ...editItemModal,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      {editItemModal.type === "catalog_material" && (
                        <div className="form-group">
                          <label>Price Tag</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editItemModal.price || ""}
                            onChange={(e) =>
                              setEditItemModal({
                                ...editItemModal,
                                price: e.target.value,
                              })
                            }
                            placeholder="e.g. ₹ 2,500 / bag"
                            required
                          />
                        </div>
                      )}

                      {editItemModal.type === "project" && (
                        <>
                          <div className="form-group">
                            <label>Project Status</label>
                            <select
                              className="form-control"
                              value={editItemModal.status}
                              onChange={(e) =>
                                setEditItemModal({
                                  ...editItemModal,
                                  status: e.target.value,
                                })
                              }
                            >
                              <option value="not-started">Not Started</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Target Completion Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={editItemModal.completionDate || ""}
                              onChange={(e) =>
                                setEditItemModal({
                                  ...editItemModal,
                                  completionDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {editItemModal.type === "task" && (
                        <>
                          <div className="form-group">
                            <label>Task Priority</label>
                            <select
                              className="form-control"
                              value={editItemModal.priority || "medium"}
                              onChange={(e) =>
                                setEditItemModal({
                                  ...editItemModal,
                                  priority: e.target.value,
                                })
                              }
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>

                          {/* Dependencies Multi-select Grid */}
                          {(() => {
                            const safeProjects = projects || [];
                            const activeProj = safeProjects.find(p => p.id === editItemModal.projectId);
                            const otherTasks = activeProj ? (activeProj.tasks || []).filter(t => t.id !== editItemModal.itemId) : [];
                            if (otherTasks.length === 0) return null;

                            return (
                              <div className="form-group" style={{ marginTop: "14px" }}>
                                <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Dependencies (Preceding Tasks)</label>
                                <div style={{
                                  maxHeight: "120px",
                                  overflowY: "auto",
                                  border: "1px solid var(--border)",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                  backgroundColor: "var(--bg-app)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  marginTop: "4px"
                                }}>
                                  {otherTasks.map(ot => {
                                    const isChecked = (editItemModal.dependencies || []).includes(ot.id);
                                    return (
                                      <label key={ot.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "var(--text-title)", margin: 0 }}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            if (!isChecked) {
                                              const hasCycle = (tasksList, startId, targetId) => {
                                                const visited = new Set();
                                                const check = (currId) => {
                                                  if (currId === targetId) return true;
                                                  if (visited.has(currId)) return false;
                                                  visited.add(currId);
                                                  const t = tasksList.find(x => x.id === currId);
                                                  if (!t || !t.dependencies) return false;
                                                  for (const dId of t.dependencies) {
                                                    if (check(dId)) return true;
                                                  }
                                                  return false;
                                                };
                                                return check(startId);
                                              };

                                              if (hasCycle(activeProj.tasks || [], ot.id, editItemModal.itemId)) {
                                                alert(`Cannot add "${ot.name}" as a dependency because it already depends on this task, creating a circular loop.`);
                                                return;
                                              }
                                            }
                                            const newDeps = isChecked
                                              ? (editItemModal.dependencies || []).filter(id => id !== ot.id)
                                              : [...(editItemModal.dependencies || []), ot.id];
                                            setEditItemModal({
                                              ...editItemModal,
                                              dependencies: newDeps
                                            });
                                          }}
                                        />
                                        {ot.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {editItemModal.type === "meeting" && (
                        <div className="form-group">
                          <label>Meeting Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={editItemModal.date}
                            onChange={(e) =>
                              setEditItemModal({
                                ...editItemModal,
                                date: e.target.value,
                              })
                            }
                            min={new Date().toISOString().split("T")[0]}
                            required
                          />
                        </div>
                      )}

                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditItemModal(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {customConfirm && (
                <div
                  className="modal-overlay"
                  onClick={() => setCustomConfirm(null)}
                  style={{ zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
                >
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%", maxWidth: "340px", borderRadius: "16px", padding: "24px 20px", textAlign: "center", margin: "auto" }}
                  >
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--text-title)" }}>
                      {customConfirm.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.5" }}>
                      {customConfirm.message}
                    </p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCustomConfirm(null)}
                        style={{ padding: "10px 20px", borderRadius: "8px", flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          customConfirm.onConfirm();
                          setCustomConfirm(null);
                        }}
                        style={{ padding: "10px 20px", borderRadius: "8px", flex: 1, backgroundColor: "#ef4444", color: "white", border: "none" }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

    </>
  );
};

export default CommonModals;
