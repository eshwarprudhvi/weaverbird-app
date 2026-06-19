import React from "react";
import { Sun, Moon, ChevronUp, ChevronDown, Mail, Trash2, LogOut, CheckCircle2, RotateCcw, Sliders, Clock } from "lucide-react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const AdminPanel = ({
  userEmail,
  setUserEmail,
  userRole,
  setUserRole,
  authorizedUsers,
  cloudSyncEnabled,
  setCloudSyncEnabled,
  setIsAuthorized,
  theme,
  toggleTheme,
  WEB_APP_VERSION,
  updateDebugInfo,
  checkUpdate,
  emailJsServiceId,
  setEmailJsServiceId,
  emailJsTemplateId,
  setEmailJsTemplateId,
  emailJsPublicKey,
  setEmailJsPublicKey,
  googleScriptUrl,
  setGoogleScriptUrl,
  recipientEmail,
  setRecipientEmail,
  backupRecipients,
  setBackupRecipients,
  lastEmailBackupDate,
  isSendingEmail,
  handleEmailReportManually,
  handleSendManualBackup,
  newRecipientInput,
  setNewRecipientInput,
  isAdminPanelOpen,
  setIsAdminPanelOpen,
  db,
  isConfigured,
  setHasLoadedProjectsFromCloud,
  setHasLoadedScheduleFromCloud,
  isAuthorized,
  setIsTrashBinOpen,
  projects,
  setIsBackupsListOpen,
  setIsEmailReportsOpen,
  isEmailReportsOpen,
  customRecipientEmail,
  setCustomRecipientEmail
}) => {
  return (
<>
                  <div className="app-header fade-in">
                    <div
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <span
                        className="header-brand"
                        style={{
                          fontSize: "22px",
                          fontWeight: "800",
                          color: "var(--text-title)",
                          fontFamily: "var(--font-title)",
                          lineHeight: "1.1",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        WeaverBird
                      </span>
                      <span
                        className="header-subtitle"
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: "var(--accent-gold-dark)",
                          textTransform: "uppercase",
                          letterSpacing: "3.5px",
                          marginTop: "2px",
                          display: "block",
                        }}
                      >
                        Interior Studio
                      </span>
                    </div>
                    <div className="header-right">
                      <button
                        className="icon-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                      >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="screen-content fade-in">
                    {/* Profile card */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "24px 0",
                        gap: "10px",
                      }}
                    >
                      <div
                        className="profile-avatar-large"
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "40px",
                          fontSize: "32px",
                          backgroundColor: "var(--accent-gold-dark)",
                          color: "white",
                        }}
                      >
                        WB
                      </div>
                      <h2
                        style={{
                          fontFamily: "var(--font-title)",
                          fontSize: "22px",
                          color: "var(--text-title)",
                          fontWeight: 700,
                        }}
                      >
                        WeaverBird
                      </h2>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginTop: "-4px",
                        }}
                      >
                        Interior Studio
                      </p>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          backgroundColor: "var(--bg-main)",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          marginTop: "4px",
                          fontWeight: 600,
                        }}
                      >
                        Version: v{WEB_APP_VERSION}
                      </span>

                      {/* Update System Monitor Card */}
                      <div style={{
                        marginTop: "12px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg-main)",
                        fontSize: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "80%",
                        maxWidth: "280px",
                        textAlign: "left"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "2px", marginBottom: "2px" }}>
                          <span style={{ fontWeight: 700, color: "var(--accent-gold-dark)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "1px" }}>
                            OTA Update Status
                          </span>
                          <button
                            onClick={() => checkUpdate(true)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "2px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              color: "var(--accent-gold-dark)",
                              opacity: 0.8,
                              transition: "opacity 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                            title="Check for update"
                          >
                            <RotateCcw size={10} />
                          </button>
                        </div>
                        <div><strong>Status:</strong> {updateDebugInfo.status}</div>
                        <div><strong>DB Version:</strong> {updateDebugInfo.latestVersion}</div>
                        {updateDebugInfo.isNative && (
                          <div style={{ wordBreak: "break-all", fontSize: "9px", color: "var(--text-muted)" }}><strong>DB URL:</strong> {updateDebugInfo.latestUrl}</div>
                        )}
                        {updateDebugInfo.error !== "None" && (
                          <div style={{ color: "#ef4444" }}><strong>Error:</strong> {updateDebugInfo.error}</div>
                        )}
                      </div>
                    </div>

                    {/* Settings list */}
                    <div className="settings-section">
                      <div className="settings-section-title">App Settings</div>

                      {/* Dark Theme toggle removed from settings list as it is already present in the profile header */}

                      <div className="settings-row">
                        <div className="settings-row-left">
                          <Sliders size={16} className="settings-row-icon" />
                          <span>Notifications</span>
                        </div>
                        <label className="switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="settings-section">
                      <div className="settings-section-title">Cloud Synchronization</div>

                      <div className="settings-row" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "10px", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div className="settings-row-left">
                            <Sliders size={16} className="settings-row-icon" />
                            <span style={{ fontWeight: 600 }}>Enable Cloud Sync</span>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={cloudSyncEnabled}
                              onChange={(e) => {
                                if (!isConfigured) {
                                  alert("Firebase keys are not configured yet! Open 'src/firebase.js' and add your API keys first.");
                                  return;
                                }
                                const val = e.target.checked;
                                setCloudSyncEnabled(val);
                                localStorage.setItem("weaverbird_cloud_sync", String(val));
                                if (val) {
                                  setHasLoadedProjectsFromCloud(false);
                                  setHasLoadedScheduleFromCloud(false);
                                } else {
                                  setIsAuthorized(true);
                                }
                              }}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>

                        {!isConfigured && (
                          <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                            ⚠️ Firebase keys not set in <code>src/firebase.js</code>. Local-only mode is active.
                          </div>
                        )}

                        {cloudSyncEnabled && isConfigured && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                            {!userEmail ? (
                              <div>
                                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Your Email Address:</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <input
                                    id="settings-email-input"
                                    type="email"
                                    placeholder="name@weaverbird.com"
                                    style={{
                                      flex: 1,
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1px solid var(--border)",
                                      backgroundColor: "var(--bg-card)",
                                      color: "var(--text-main)",
                                      fontSize: "13px"
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const emailVal = document.getElementById("settings-email-input")?.value?.toLowerCase()?.trim();
                                      if (!emailVal || !emailVal.includes("@")) {
                                        alert("Please enter a valid email address!");
                                        return;
                                      }
                                      setUserEmail(emailVal);
                                      localStorage.setItem("weaverbird_user_email", emailVal);
                                    }}
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "8px",
                                      backgroundColor: "var(--accent-gold-dark)",
                                      color: "white",
                                      border: "none",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      cursor: "pointer"
                                    }}
                                  >
                                    Connect
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Connected Account:</span>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>{userEmail}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (confirm("Are you sure you want to logout and disconnect from cloud sync?")) {
                                        setUserEmail("");
                                        localStorage.removeItem("weaverbird_user_email");
                                        localStorage.removeItem("weaverbird_user_role");
                                        setIsAuthorized(true);
                                      }
                                    }}
                                    style={{
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                                      color: "#ef4444",
                                      border: "1px solid rgba(239, 68, 68, 0.2)",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px"
                                    }}
                                  >
                                    <LogOut size={13} />
                                    Logout
                                  </button>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "8px", fontSize: "12px" }}>
                                  <span>Role: <strong style={{ color: "var(--accent-gold)" }}>{(userRole || "editor").toUpperCase()}</strong></span>
                                  <span>Status: {isAuthorized ? <strong style={{ color: "#22c55e" }}>AUTHORIZED</strong> : <strong style={{ color: "#ef4444" }}>PENDING APPROVAL</strong>}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ADMIN PANEL - Only displays if current user is admin */}
                      {cloudSyncEnabled && isConfigured && userRole === "admin" && isAuthorized && (
                        <div className="settings-row" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "12px", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                          <div
                            onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%" }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--accent-gold-dark)", fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" }}>Admin Access Panel</span>
                            {isAdminPanelOpen ? <ChevronUp size={16} style={{ color: "var(--accent-gold-dark)" }} /> : <ChevronDown size={16} style={{ color: "var(--accent-gold-dark)" }} />}
                          </div>

                          {isAdminPanelOpen && (
                            <>
                              {/* Invite new user */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                                <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Invite Partner / Subcontractor Email:</label>
                                <input
                                  id="invite-email-input"
                                  type="email"
                                  placeholder="partner@weaverbird.com"
                                  style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--bg-card)",
                                    color: "var(--text-main)",
                                    fontSize: "13.5px",
                                    outline: "none"
                                  }}
                                />
                                <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                  <select
                                    id="invite-role-select"
                                    defaultValue="editor"
                                    style={{
                                      flex: 1,
                                      padding: "10px",
                                      borderRadius: "8px",
                                      border: "1px solid var(--border)",
                                      backgroundColor: "var(--bg-card)",
                                      color: "var(--text-main)",
                                      fontSize: "13px",
                                      outline: "none"
                                    }}
                                  >
                                    <option value="editor">Editor Access</option>
                                    <option value="admin">Admin Access</option>
                                  </select>
                                  <button
                                    onClick={async () => {
                                      const emailEl = document.getElementById("invite-email-input");
                                      const roleEl = document.getElementById("invite-role-select");
                                      const emailVal = emailEl?.value?.toLowerCase()?.trim();
                                      const roleVal = roleEl?.value;

                                      if (!emailVal || !emailVal.includes("@")) {
                                        alert("Please enter a valid email to invite.");
                                        return;
                                      }
                                      try {
                                        await setDoc(doc(db, "users", emailVal), { role: roleVal });
                                        alert(`Successfully granted ${roleVal} access to ${emailVal}!`);
                                        if (emailEl) emailEl.value = "";
                                      } catch (err) {
                                        alert(`Failed to add user: ${err.message}`);
                                      }
                                    }}
                                    style={{
                                      padding: "10px 20px",
                                      borderRadius: "8px",
                                      backgroundColor: "var(--accent-gold-dark)",
                                      color: "white",
                                      border: "none",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      boxShadow: "0 4px 10px rgba(212, 175, 55, 0.15)"
                                    }}
                                  >
                                    Add Partner
                                  </button>
                                </div>
                              </div>

                              {/* Authorized users list */}
                              <div style={{ marginTop: "8px" }}>
                                <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Users With Access ({authorizedUsers.length})</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                                  {authorizedUsers.map(u => (
                                    <div
                                      key={u.email}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-body)",
                                        border: "1px solid var(--border)"
                                      }}
                                    >
                                      <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>{u.email}</span>
                                        <span style={{ fontSize: "10px", color: "var(--accent-gold)" }}>Role: {u.role.toUpperCase()}</span>
                                      </div>

                                      {u.email !== userEmail.toLowerCase().trim() ? (
                                        <div style={{ display: "flex", gap: "6px" }}>
                                          <select
                                            value={u.role}
                                            onChange={async (e) => {
                                              try {
                                                await setDoc(doc(db, "users", u.email), { role: e.target.value });
                                              } catch (err) {
                                                alert(`Failed to update role: ${err.message}`);
                                              }
                                            }}
                                            style={{
                                              padding: "4px",
                                              borderRadius: "6px",
                                              border: "1px solid var(--border)",
                                              backgroundColor: "var(--bg-card)",
                                              color: "var(--text-main)",
                                              fontSize: "11px"
                                            }}
                                          >
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                          </select>
                                          <button
                                            onClick={async () => {
                                              if (confirm(`Are you sure you want to revoke access for ${u.email}?`)) {
                                                try {
                                                  await deleteDoc(doc(db, "users", u.email));
                                                } catch (err) {
                                                  alert(`Failed to revoke access: ${err.message}`);
                                                }
                                              }
                                            }}
                                            style={{
                                              padding: "4px 8px",
                                              borderRadius: "6px",
                                              backgroundColor: "#ef4444",
                                              color: "white",
                                              border: "none",
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              cursor: "pointer"
                                            }}
                                          >
                                            Revoke
                                          </button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>You</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="settings-section">
                      <div className="settings-section-title">Data Security & Recovery</div>

                      {/* Recycle Bin row */}
                      <div
                        className="settings-row"
                        onClick={() => setIsTrashBinOpen(true)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div className="settings-row-left">
                          <Trash2 size={16} className="settings-row-icon" />
                          <span>Recycle Bin (Trash)</span>
                        </div>
                        <span style={{
                          fontSize: "12px",
                          backgroundColor: "rgba(212, 175, 55, 0.15)",
                          color: "var(--accent-gold)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: 600
                        }}>
                          {projects.filter(p => p.isTrashed).length} item(s)
                        </span>
                      </div>

                      {/* Local Backups row */}
                      <div
                        className="settings-row"
                        onClick={() => setIsBackupsListOpen(true)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div className="settings-row-left">
                          <Clock size={16} className="settings-row-icon" />
                          <span>Restore Backup Snapshots</span>
                        </div>
                        <span style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontWeight: 600
                        }}>
                          View history
                        </span>
                      </div>
                    </div>

                    {userRole === "admin" && (
                      <div className="settings-section">
                        <div
                          className="settings-section-title"
                          onClick={() => setIsEmailReportsOpen(!isEmailReportsOpen)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        >
                          <span>Email Reports & Automation</span>
                          {isEmailReportsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>

                        {isEmailReportsOpen && (
                          <>
                            {/* Part 1: Quick Send Manual Backup */}
                            <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                                Send Manual Studio Backup
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                Send a complete PDF report of all active projects immediately:
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
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
                                    fontSize: "12.5px"
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
                                  onClick={handleSendManualBackup}
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
                                    fontSize: "12.5px",
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
                                      <span>Send Now</span>
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
                                    fontSize: "12.5px"
                                  }}
                                />
                              )}
                            </div>

                            {/* Google Apps Script Integration Config */}
                            <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                                Google Apps Script Web App URL
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                Paste your Google Script URL to send email reports for free using your Gmail account:
                              </div>

                              {import.meta.env.VITE_GOOGLE_SCRIPT_URL ? (
                                <div style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                                  border: "1px solid rgba(34, 197, 94, 0.2)",
                                  color: "#22c55e",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 600
                                }}>
                                  ✓ Configured via environment variable (.env)
                                </div>
                              ) : (
                                <input
                                  type="url"
                                  placeholder="https://script.google.com/macros/s/.../exec"
                                  value={googleScriptUrl}
                                  onChange={(e) => setGoogleScriptUrl(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--bg-main)",
                                    color: "var(--text-main)",
                                    fontSize: "12.5px"
                                  }}
                                />
                              )}
                            </div>

                            {/* Part 2: Mailing List Directory Manager */}
                            <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                                Mailing List Directory
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                Manage which email addresses appear in your quick-select mailing directory:
                              </div>

                              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                <input
                                  type="email"
                                  placeholder="client-or-partner@example.com"
                                  value={newRecipientInput}
                                  onChange={(e) => setNewRecipientInput(e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--bg-main)",
                                    color: "var(--text-main)",
                                    fontSize: "12.5px"
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const cleanInput = newRecipientInput.toLowerCase().trim();
                                    if (!cleanInput || !cleanInput.includes("@")) {
                                      alert("Please enter a valid email address.");
                                      return;
                                    }
                                    if (backupRecipients.includes(cleanInput)) {
                                      alert("This email is already in the list.");
                                      return;
                                    }
                                    setBackupRecipients([...backupRecipients, cleanInput]);
                                    setNewRecipientInput("");
                                  }}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "var(--accent-gold)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "12.5px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Add
                                </button>
                              </div>

                              {backupRecipients.length > 0 ? (
                                <div style={{
                                  width: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  maxHeight: "120px",
                                  overflowY: "auto",
                                  border: "1px solid var(--border)",
                                  borderRadius: "8px",
                                  padding: "8px",
                                  backgroundColor: "var(--bg-main)",
                                  marginTop: "4px"
                                }}>
                                  {backupRecipients.map(email => (
                                    <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 8px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                                      <span style={{ color: "var(--text-main)" }}>{email}</span>
                                      <button
                                        onClick={() => {
                                          setBackupRecipients(backupRecipients.filter(e => e !== email));
                                        }}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: "#ef4444",
                                          cursor: "pointer",
                                          padding: "2px"
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>
                                  No custom recipient emails added. Add above to build your quick mailing list directory.
                                </div>
                              )}
                            </div>

                            {/* Part 3: Automated backup status row */}
                            <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" }}>
                              <div className="settings-row-left">
                                <Mail size={16} className="settings-row-icon" style={{ color: "var(--text-muted)", marginRight: "8px" }} />
                                <span>3-Day Auto Backup Email</span>
                              </div>
                              <span style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                                fontWeight: 600
                              }}>
                                {lastEmailBackupDate ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span>Last: {new Date(lastEmailBackupDate).toLocaleDateString()}</span>
                                    <span style={{ fontSize: "10px", color: "var(--accent-gold)", marginTop: "2px", fontWeight: "normal" }}>
                                      {(() => {
                                        const lastSent = new Date(lastEmailBackupDate).getTime();
                                        const nextBackupTime = lastSent + (3 * 24 * 60 * 60 * 1000);
                                        const diffMs = nextBackupTime - Date.now();
                                        const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                                        if (diffDays <= 0) return "Next: Due today";
                                        return `Next: In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
                                      })()}
                                    </span>
                                  </div>
                                ) : "Pending"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="settings-section">
                      <div className="settings-section-title">Database & Sync</div>

                      <div
                        className="settings-row"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Do you want to clear all local app data? This will reset this device to a clean state and disconnect it from cloud sync, without deleting any shared data from the cloud."
                            )
                          ) {
                            localStorage.setItem("weaverbird_cloud_sync", "false");
                            localStorage.setItem("weaverbird_user_email", "");
                            localStorage.setItem("weaverbird_user_role", "");
                            localStorage.setItem("weaverbird_user_authorized", "true");
                            localStorage.setItem(
                              "ipm_projects",
                              JSON.stringify([])
                            );
                            localStorage.setItem(
                              "ipm_schedule",
                              JSON.stringify([])
                            );
                            window.location.reload();
                          }
                        }}
                      >
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>
                          Reset App Data
                        </span>
                      </div>

                      <div className="settings-row" style={{ cursor: "default" }}>
                        <div className="settings-row-left">
                          <span>App Version</span>
                        </div>
                        <span
                          style={{ fontSize: "12px", color: "var(--text-muted)" }}
                        >
                          {WEB_APP_VERSION} (Production)
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 16px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <p>
                        © {new Date().getFullYear()} WeaverBird Interior Studio.
                      </p>
                      <p style={{ marginTop: "4px", opacity: 0.7 }}>
                        All rights reserved.
                      </p>
                    </div>
                  </div>
                </>
              );
};
export default AdminPanel;
