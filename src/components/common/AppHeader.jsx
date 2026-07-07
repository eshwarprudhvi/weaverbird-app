import React from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import Avatar from './Avatar/Avatar';

const AppHeader = ({ 
  variant = 'page', 
  title,
  leftActions = null,
  rightActions = null,
  subtitleNode = null 
}) => {
  const { workspace } = useWorkspace();
  
  const compName = workspace?.companyName || 'My Workspace';
  const studName = workspace?.studioName || 'Interior Studio';
  const initials = compName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (variant === 'branding') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-nav-solid)',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Avatar initials={initials} size={52} style={{ backgroundColor: 'var(--accent-gold)', fontSize: '18px', fontWeight: 800 }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-title)',
              fontSize: '18px',
              color: 'var(--accent-gold)',
              fontWeight: 800,
              margin: '0',
              letterSpacing: '0.3px'
            }}>
              {compName}
            </h2>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              margin: '2px 0 0 0',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              {studName}
            </p>
            {subtitleNode && (
              <div style={{ marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>
                {subtitleNode}
              </div>
            )}
          </div>
        </div>
        {rightActions}
      </div>
    );
  }

  // "page" variant (like ProjectsList or ScheduleView)
  return (
    <div className="app-header fade-in" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: 'calc(20px + env(safe-area-inset-top, 0px)) 20px 20px 20px',
      backgroundColor: 'var(--bg-nav-solid)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {leftActions}
        {/* Optional Logo for page headers */}
        {!leftActions && <Avatar initials={initials} size={36} style={{ backgroundColor: 'var(--accent-gold)', fontSize: '14px' }} />}
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: title ? '16px' : '20px',
            fontWeight: "800",
            color: title ? "var(--text-title)" : "var(--accent-gold)",
            fontFamily: "var(--font-title)",
            lineHeight: "1.1",
            letterSpacing: "-0.3px",
          }}>
            {title || compName}
          </span>
          <span style={{
            fontSize: "10px",
            fontWeight: "600",
            color: title ? "var(--text-muted)" : "var(--accent-gold-dark)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginTop: "2px",
            display: "inline-flex",
            alignItems: "center",
          }}>
            {title ? compName : studName}
            {subtitleNode && (
              <span style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                {subtitleNode}
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightActions}
      </div>
    </div>
  );
};

export default AppHeader;
