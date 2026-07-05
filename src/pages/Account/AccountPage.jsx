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

import { WORKSPACE_CONNECTION_STATES } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";

import { Moon, Sun, Trash2, Mail, Shield, CheckCircle2, Sliders, LogOut, Cloud, Users, Save, Smartphone, Palette, Bell, HelpCircle, FileText, Info, ExternalLink, User } from "lucide-react";

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
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isAppearanceSheetOpen, setIsAppearanceSheetOpen] = useState(false);
  const [isNotificationsSheetOpen, setIsNotificationsSheetOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

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
            color: (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "#10b981" : "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: (workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "#10b981" : "var(--text-muted)", display: "inline-block" }} />
            {(workspaceConnectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || workspaceConnectionState === WORKSPACE_CONNECTION_STATES.SYNCING) ? "Connected Cloud Workspace" : "Offline Workspace"}
          </span>
        }
      />

      <div style={{ padding: '0 20px', marginTop: '24px' }}>

        {/* DEDICATED WORKSPACE SECTION */}
        <div style={{ marginBottom: '28px' }}>
          <WorkspaceStatusCard
            connectionState={workspaceConnectionState}
            companyName={companyName || workspace?.companyName}
            onConnect={connectFromOffline}
            onManage={() => setActiveView('team')}
            onRetry={connectFromOffline}
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

    </div>
  );
};

export default AccountPage;
