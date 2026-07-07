import React, { useState } from "react";
import AppHeader from "../../components/common/AppHeader";
import FeatureCard from "../../components/account/FeatureCard";
import QuickToolCard from "../../components/account/QuickToolCard";
import ListRow from "../../components/account/ListRow";
import TeamManagementPage from "../../components/account/pages/TeamManagementPage";
import EmailReportsPage from "../../components/account/pages/EmailReportsPage";
import BusinessProfilePage from "../../components/account/pages/BusinessProfilePage";
import CloudSyncModal from "../../components/account/modals/CloudSyncModal";
import BottomSheet from "../../components/account/modals/BottomSheet";
import { APPLICATION } from "../../config/application";
import useAuth from "../../hooks/useAuth";
import WorkspaceStatusCard from "../../components/account/WorkspaceStatusCard";
import WorkspaceSelector from "../../components/auth/WorkspaceSelector";
import WorkspaceCreationForm from "../../components/auth/WorkspaceCreationForm";

import { WORKSPACE_CONNECTION_STATES } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";

import { Moon, Sun, Trash2, Mail, Shield, CheckCircle2, Sliders, LogOut, Cloud, Users, Save, Smartphone, Palette, Bell, HelpCircle, FileText, Info, ExternalLink, User, Lock, KeyRound } from "lucide-react";
import { auth as firebaseAuth, isConfigured as firebaseIsConfigured } from "../../firebase";
import { EmailAuthProvider, linkWithCredential, sendPasswordResetEmail } from "firebase/auth";

const AccountPage = (props) => {
  const {
    companyName,
    companySubtitle,
    userEmail,
    setUserEmail,
    userRole,
    authorizedUsers,
    cloudSyncEnabled,
    setCloudSyncEnabled,
    setIsAuthorized,
    theme,
    toggleTheme,
    WEB_APP_VERSION,
    checkUpdate,
    recipientEmail,
    setRecipientEmail,
    backupRecipients,
    setBackupRecipients,
    lastEmailBackupDate,
    isSendingEmail,
    handleSendManualBackup,
    newRecipientInput,
    setNewRecipientInput,
    db,
    isAuthorized,
    setIsTrashBinOpen,
    setIsBackupsListOpen,
    customRecipientEmail,
    setCustomRecipientEmail
  } = props;

  const { workspaceConnectionState, connectFromOffline, user, logout, isAuthenticated, isLocalMode } = useAuth();
  const { workspace, lastSynced } = useWorkspace();

  const [activeView, setActiveView] = useState('main'); // 'main', 'team', 'reports', 'profile'
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [workspaceModalMode, setWorkspaceModalMode] = useState('select'); // 'select' or 'create'
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isAppearanceSheetOpen, setIsAppearanceSheetOpen] = useState(false);
  const [isNotificationsSheetOpen, setIsNotificationsSheetOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Set Password for Email Login
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Change Password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState({ type: "", text: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);

  React.useEffect(() => {
    if (firebaseIsConfigured && firebaseAuth?.currentUser) {
      const providers = firebaseAuth.currentUser.providerData || [];
      setHasPasswordProvider(providers.some(p => p.providerId === "password"));
      setHasGoogleProvider(providers.some(p => p.providerId === "google.com"));
    }
  }, []);

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setIsSettingPassword(true);
    setPasswordMessage({ type: "", text: "" });
    try {
      const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email, newPassword);
      await linkWithCredential(firebaseAuth.currentUser, credential);
      setPasswordMessage({ type: "success", text: "Password set! You can now use email & password to sign in." });
      setNewPassword("");
      setConfirmPassword("");
      setShowSetPassword(false);
      setHasPasswordProvider(true);
    } catch (err) {
      if (err.code === "auth/provider-already-linked") {
        setPasswordMessage({ type: "error", text: "A password is already set for this account." });
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordMessage({ type: "error", text: "Please sign out and sign back in with Google, then try again." });
      } else {
        setPasswordMessage({ type: "error", text: err.message || "Failed to set password." });
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setIsChangingPassword(true);
    setChangePasswordMessage({ type: "", text: "" });
    try {
      await sendPasswordResetEmail(firebaseAuth, firebaseAuth.currentUser.email);
      setChangePasswordMessage({ type: "success", text: "Success! A secure password reset link has been sent. Please check your inbox (and Spam/Junk folder) to set your new password." });
      
      // Hide the message after a short delay
      setTimeout(() => {
        setShowChangePassword(false);
        setChangePasswordMessage({ type: "", text: "" });
      }, 5000);
    } catch (err) {
      setChangePasswordMessage({ type: "error", text: err.message || "Failed to send reset email." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calculate local projects count from localStorage
  const getLocalProjectsCount = () => {
    try {
      const raw = localStorage.getItem("ipm_projects");
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch (e) { }
    return props.projects?.length || 0;
  };
  const localProjectCount = getLocalProjectsCount();

  // Estimate storage footprint from localStorage
  const getStorageUsedStr = () => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ipm_")) {
          const val = localStorage.getItem(key) || "";
          totalBytes += val.length * 2;
        }
      }
      if (totalBytes < 1024) return `${totalBytes} B`;
      if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
      return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    } catch (e) {
      return "0 KB";
    }
  };

  const getFormattedLastSync = () => {
    if (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) return "Syncing...";
    if (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNC_ERROR) return "Sync Failed";
    if (!lastSynced) {
      return (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED) ? "Just now" : "Not synced";
    }
    const now = new Date();
    const diffSecs = Math.floor((now - new Date(lastSynced)) / 1000);
    if (diffSecs < 60) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    return "Yesterday";
  };

  // --- Sub-View Renderers ---
  if (activeView === 'team') {
    return <TeamManagementPage
      onBack={() => setActiveView('main')}
      authorizedUsers={authorizedUsers}
      userEmail={userEmail}
      db={db}
      projectsCount={localProjectCount || props.projects?.length || 0}
      storageUsed={getStorageUsedStr()}
      lastSyncText={getFormattedLastSync()}
      connectionState={workspaceConnectionState}
      onRetry={connectFromOffline}
    />;
  }
  if (activeView === 'profile') {
    return <BusinessProfilePage onBack={() => setActiveView('main')} companyName={companyName} companySubtitle={companySubtitle} />;
  }
  if (activeView === 'reports') {
    return <EmailReportsPage
      onBack={() => setActiveView('main')}
      recipientEmail={recipientEmail} setRecipientEmail={setRecipientEmail}
      backupRecipients={backupRecipients} setBackupRecipients={setBackupRecipients}
      isSendingEmail={isSendingEmail} handleSendManualBackup={handleSendManualBackup}
      newRecipientInput={newRecipientInput} setNewRecipientInput={setNewRecipientInput}
      customRecipientEmail={customRecipientEmail} setCustomRecipientEmail={setCustomRecipientEmail}
      db={db}
    />;
  }

  // --- Main Dashboard View ---
  return (
    <div className="screen-content fade-in" style={{ padding: '0 0 80px 0', backgroundColor: 'var(--bg-app)' }}>
      <AppHeader
        variant="branding"
        subtitleNode={
          <span style={{
            color: (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "#10b981" : (isAuthenticated ? "#3b82f6" : "var(--text-muted)"),
            display: "inline-flex",
            alignItems: "center",
            gap: "5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "#10b981" : (isAuthenticated ? "#3b82f6" : "var(--text-muted)"), display: "inline-block" }} />
            {(workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "Connected Cloud Workspace" : (isAuthenticated ? "Cloud Account (Select Workspace)" : "Offline Workspace")}
          </span>
        }
      />

      <div style={{ padding: '0 20px', marginTop: '24px' }}>

        {/* DEDICATED WORKSPACE SECTION */}
        <div style={{ marginBottom: '28px' }}>
          <WorkspaceStatusCard
            connectionState={workspaceConnectionState}
            companyName={companyName || workspace?.companyName}
            onConnect={() => {
              if (isLocalMode) connectFromOffline();
              setWorkspaceModalMode('select');
              setIsWorkspaceModalOpen(true);
            }}
            onManage={() => {
              if (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.UNCONFIGURED || !workspace?.id) {
                setWorkspaceModalMode('select');
                setIsWorkspaceModalOpen(true);
              } else {
                setActiveView('team');
              }
            }}
            onRetry={() => {
              if (isLocalMode) connectFromOffline();
              setWorkspaceModalMode('select');
              setIsWorkspaceModalOpen(true);
            }}
          />
        </div>

        {/* QUICK TOOLS */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            Quick Tools
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <QuickToolCard
              icon={User}
              title="Business Profile"
              iconColor="var(--accent-gold)"
              onClick={() => setActiveView('profile')}
            />
            <QuickToolCard
              icon={Palette}
              title="Appearance"
              iconColor="var(--text-title)"
              onClick={() => setIsAppearanceSheetOpen(true)}
            />
            <QuickToolCard
              icon={Bell}
              title="Notifications"
              iconColor="#f59e0b"
              onClick={() => setIsNotificationsSheetOpen(true)}
            />
            <QuickToolCard
              icon={Save}
              title="Backups"
              iconColor="#6366f1"
              onClick={() => setIsBackupsListOpen(true)}
            />
            <QuickToolCard
              icon={Trash2}
              title="Recycle Bin"
              iconColor="#ef4444"
              onClick={() => setIsTrashBinOpen(true)}
            />
          </div>
        </div>

        {/* SETTINGS (ADVANCED ONLY) */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            Settings
          </h3>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <ListRow icon={Sliders} title="Language" rightElement={<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>English</span>} />
            <ListRow icon={Cloud} title="Data & Storage" rightElement={<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{getStorageUsedStr()}</span>} onClick={() => window.alert(`Storage footprint: ${getStorageUsedStr()}\nLocal cached assets: Optimized & synchronized.`)} />
            <ListRow icon={Smartphone} title="App Update" borderBottom={false} rightElement={<span style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: 600 }}>v{WEB_APP_VERSION}</span>} onClick={() => checkUpdate(true)} />
          </div>
        </div>

        {/* SECURITY & LOGIN (For users WITH password) */}
        {hasPasswordProvider && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
              Security & Login
            </h3>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              
              {!showChangePassword ? (
                <ListRow icon={KeyRound} title="Change Password" onClick={() => setShowChangePassword(true)} borderBottom={false} />
              ) : (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-title)' }}>Change Password</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Click below to receive a secure link to reset your password.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    {changePasswordMessage.text && (
                      <div style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', backgroundColor: changePasswordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: changePasswordMessage.type === 'error' ? '#ef4444' : '#10b981' }}>
                        {changePasswordMessage.text}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          setShowChangePassword(false);
                          setChangePasswordMessage({ type: "", text: "" });
                        }}
                        style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendPasswordReset}
                        disabled={isChangingPassword}
                        style={{ flex: 1, padding: '10px', backgroundColor: 'var(--accent-gold)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: isChangingPassword ? 'not-allowed' : 'pointer', opacity: isChangingPassword ? 0.7 : 1 }}
                      >
                        {isChangingPassword ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURITY & LOGIN (For Google users without password) */}
        {hasGoogleProvider && !hasPasswordProvider && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
              Security & Login
            </h3>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-title)' }}>Enable Email & Password Login</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>You currently sign in with Google. Set a password to also allow signing in with your email address.</p>
                </div>
              </div>

              {!showSetPassword ? (
                <button
                  onClick={() => setShowSetPassword(true)}
                  style={{ padding: '10px 16px', backgroundColor: 'var(--accent-gold)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Set Password
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  {passwordMessage.text && (
                    <div style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', backgroundColor: passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: passwordMessage.type === 'error' ? '#ef4444' : '#10b981' }}>
                      {passwordMessage.text}
                    </div>
                  )}
                  <input
                    type="password"
                    placeholder="New Password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleSetPassword}
                      disabled={isSettingPassword}
                      style={{ padding: '10px 16px', backgroundColor: 'var(--accent-gold)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flex: 1, opacity: isSettingPassword ? 0.7 : 1 }}
                    >
                      {isSettingPassword ? "Saving..." : "Save Password"}
                    </button>
                    <button
                      onClick={() => { setShowSetPassword(false); setPasswordMessage({ type: "", text: "" }); }}
                      style={{ padding: '10px 16px', backgroundColor: 'transparent', color: 'var(--text-title)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEVEL 1: PRIMARY FEATURES */}
        {userRole === 'admin' && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
              Primary Features
            </h3>
            <FeatureCard
              icon={Mail}
              title="Email Reports"
              status={`Daily Schedule • ${backupRecipients?.length || 0} Recipient${backupRecipients?.length === 1 ? '' : 's'}`}
              iconColor="#10b981"
              onClick={() => setActiveView('reports')}
            />
          </div>
        )}

        {/* SUPPORT */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            Support
          </h3>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <ListRow icon={HelpCircle} title="Help Center" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={Shield} title="Privacy Policy" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={FileText} title="Terms & Conditions" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={Info} title="About This App" borderBottom={false} rightElement={<ExternalLink size={14} color="var(--text-muted)" />} onClick={() => setIsAboutModalOpen(true)} />
          </div>
        </div>

        {/* SESSION ACTIONS */}
        {(isAuthenticated || user || isLocalMode) && (
          <div style={{ marginBottom: '16px' }}>
            <div
              onClick={async () => {
                const promptMsg = (isAuthenticated || user)
                  ? "Are you sure you want to sign out? Your cloud data is safe, but local unsynced changes will remain on this device."
                  : "Are you sure you want to exit offline mode and return to the onboarding screen?";
                if (window.confirm(promptMsg)) {
                  await logout();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
              }}
            >
              <LogOut size={18} />
              <span>{(isAuthenticated || user) ? "Sign Out of Workspace" : "Exit to Sign In Screen"}</span>
            </div>
          </div>
        )}

      </div>

      {/* --- Modals & Bottom Sheets --- */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        cloudSyncEnabled={cloudSyncEnabled} setCloudSyncEnabled={setCloudSyncEnabled}
        userEmail={userEmail} setUserEmail={setUserEmail}
        userRole={userRole} isAuthorized={isAuthorized} setIsAuthorized={setIsAuthorized}
      />

      <BottomSheet isOpen={isAppearanceSheetOpen} onClose={() => setIsAppearanceSheetOpen(false)} title="Appearance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System Default', icon: Smartphone }
          ].map((option) => (
            <div
              key={option.id}
              onClick={() => {
                if (option.id === 'light' && theme !== 'light') toggleTheme();
                if (option.id === 'dark' && theme !== 'dark') toggleTheme();
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: (theme === option.id || (option.id === 'dark' && theme === 'dark')) ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <option.icon size={20} color={(theme === option.id || (option.id === 'dark' && theme === 'dark')) ? 'var(--accent-gold)' : 'var(--text-main)'} />
                <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{option.label}</span>
              </div>
              {(theme === option.id || (option.id === 'dark' && theme === 'dark')) && <CheckCircle2 size={18} color="var(--accent-gold)" />}
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isNotificationsSheetOpen} onClose={() => setIsNotificationsSheetOpen(false)} title="Notifications">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { title: 'Enable Notifications', desc: 'Master switch for all alerts' },
            { title: 'Email Notifications', desc: 'Daily project summaries and reports' },
            { title: 'Reminder Notifications', desc: 'Approaching deadlines and tasks' }
          ].map((notif, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{notif.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{notif.desc}</span>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} title="About">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px' }}>
              A
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title)', margin: 0 }}>Apex Studio</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: 600 }}>Multi-Company SaaS Platform</p>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Version</span>
              <span style={{ fontWeight: 700, color: 'var(--text-title)' }}>v{WEB_APP_VERSION}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Build Number</span>
              <span style={{ fontWeight: 700, color: 'var(--text-title)' }}>2026.07.04-PROD</span>
            </div>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Changelog</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, display: 'block' }}>
                v{WEB_APP_VERSION}: Minimal & Clean Account page architecture, unified workspace connection state machine, offline transition improvements, and enterprise dashboard refinements.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>License</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Prudhvishwar</span>
            </div>
            <div style={{ padding: '14px 16px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Credits</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, display: 'block' }}>
                Designed & Engineered by the Prudhvishwar.
              </span>
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        title={workspaceModalMode === 'create' ? "Create a Workspace" : "Your Workspaces"}
      >
        <div style={{ padding: '8px 0', minHeight: '300px' }}>
          {workspaceModalMode === 'create' ? (
            <WorkspaceCreationForm
              onBack={() => setWorkspaceModalMode('select')}
              onSuccess={() => setIsWorkspaceModalOpen(false)}
            />
          ) : (
            <WorkspaceSelector
              onSelectWorkspace={(wsId) => {
                setIsWorkspaceModalOpen(false);
              }}
              onAddNewWorkspace={() => setWorkspaceModalMode('create')}
            />
          )}
        </div>
      </BottomSheet>

    </div>
  );
};

export default AccountPage;
