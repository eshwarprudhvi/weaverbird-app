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

  const [activeView, setActiveView] = useState('main'); // 'main', 'team', 'reports', 'profile'
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isAppearanceSheetOpen, setIsAppearanceSheetOpen] = useState(false);
  const [isNotificationsSheetOpen, setIsNotificationsSheetOpen] = useState(false);

  // --- Sub-View Renderers ---
  if (activeView === 'team') {
    return <TeamManagementPage onBack={() => setActiveView('main')} authorizedUsers={authorizedUsers} userEmail={userEmail} db={db} />;
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
      <AppHeader variant="branding" />

      <div style={{ padding: '0 20px', marginTop: '24px' }}>
        
        {/* LEVEL 1: PRIMARY FEATURES */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Primary Features
          </h3>
          <FeatureCard 
            icon={Cloud} 
            title="Cloud Sync" 
            status={cloudSyncEnabled ? (userEmail || "Connected") : "Offline"}
            badge={cloudSyncEnabled && isAuthorized ? "Active" : null}
            iconColor="var(--accent-blue)"
            onClick={() => setIsCloudSyncModalOpen(true)}
          />
          {userRole === 'admin' && (
            <FeatureCard 
              icon={Users} 
              title="Workspace" 
              status={`${authorizedUsers?.length || 0} Members • ${authorizedUsers?.filter(u => u.role === 'admin').length || 0} Admins`}
              iconColor="var(--accent-gold)"
              onClick={() => setActiveView('team')}
            />
          )}
          {userRole === 'admin' && (
            <FeatureCard 
              icon={Mail} 
              title="Email Reports" 
              status={`Daily Schedule • ${backupRecipients?.length || 0} Recipient${backupRecipients?.length === 1 ? '' : 's'}`}
              iconColor="#10b981"
              onClick={() => setActiveView('reports')}
            />
          )}
        </div>

        {/* LEVEL 2: QUICK TOOLS */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Quick Tools
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <QuickToolCard 
              icon={User} 
              title="Profile" 
              subtitle="Edit business info"
              iconColor="var(--accent-gold)"
              onClick={() => setActiveView('profile')}
            />
            <QuickToolCard 
              icon={Save} 
              title="Backups" 
              subtitle="Last backup: Never"
              iconColor="#6366f1"
              onClick={() => setIsBackupsListOpen(true)}
            />
            <QuickToolCard 
              icon={Trash2} 
              title="Recycle Bin" 
              subtitle="0 items"
              iconColor="#ef4444"
              onClick={() => setIsTrashBinOpen(true)}
            />
            <QuickToolCard 
              icon={Palette} 
              title="Appearance" 
              subtitle={theme === 'dark' ? "Dark Mode" : "Light Mode"}
              iconColor="var(--text-title)"
              onClick={() => setIsAppearanceSheetOpen(true)}
            />
            <QuickToolCard 
              icon={Bell} 
              title="Notifications" 
              subtitle="Enabled"
              iconColor="#f59e0b"
              onClick={() => setIsNotificationsSheetOpen(true)}
            />
          </div>
        </div>

        {/* LEVEL 3: SUPPORT */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Support
          </h3>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <ListRow icon={HelpCircle} title="Help Center" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={Shield} title="Privacy Policy" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={FileText} title="Terms & Conditions" rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
            <ListRow icon={Info} title="About Weaver Bird" borderBottom={false} rightElement={<ExternalLink size={14} color="var(--text-muted)" />} />
          </div>
        </div>

        {/* VERSION */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Weaver Bird v{WEB_APP_VERSION}
          </p>
        </div>

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

    </div>
  );
};

export default AccountPage;
