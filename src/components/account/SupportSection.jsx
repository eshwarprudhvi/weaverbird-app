import React from 'react';
import { HelpCircle, MessageSquare, Shield, FileText, Info, Smartphone } from 'lucide-react';
import SettingsSection, { SettingsRow } from './SettingsSection';

const SupportSection = ({ version, onCheckUpdate }) => {
  return (
    <SettingsSection title="Help & Support">
      <SettingsRow icon={HelpCircle} title="Help Center" />
      <SettingsRow icon={MessageSquare} title="Contact Support" />
      <SettingsRow icon={Shield} title="Privacy Policy" />
      <SettingsRow icon={FileText} title="Terms & Conditions" />
      <SettingsRow icon={Info} title="About Weaver Bird" />
      
      {/* Version and Update Check */}
      <div 
        onClick={onCheckUpdate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-main)'
        }}
      >
        <Smartphone size={24} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
          App Version V {version}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--accent-gold)', marginTop: '4px' }}>
          Check for Updates
        </span>
      </div>
    </SettingsSection>
  );
};

export default SupportSection;
