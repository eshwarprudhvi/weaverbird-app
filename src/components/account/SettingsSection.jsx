import React from 'react';
import { ChevronRight } from 'lucide-react';
import Section from '../common/Section/Section';
import Card from '../common/Card/Card';

export const SettingsRow = ({ icon: Icon, title, onClick, rightElement, borderBottom = true }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: borderBottom ? '1px solid var(--border)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {Icon && <Icon size={20} color="var(--accent-gold)" />}
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-title)' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {rightElement || (onClick && <ChevronRight size={18} color="var(--text-muted)" />)}
      </div>
    </div>
  );
};

const SettingsSection = ({ children, title }) => {
  return (
    <Section title={title} style={{ padding: '0 20px' }}>
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        {children}
      </Card>
    </Section>
  );
};

export default SettingsSection;
