import React from 'react';

const QuickToolCard = ({ icon: Icon, title, subtitle, onClick, iconColor = "var(--text-main)", bgColor = "var(--bg-card)" }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        padding: '14px 8px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        gap: '8px',
        textAlign: 'center',
        minHeight: '88px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border)'
      }}>
        {Icon && <Icon size={18} color={iconColor} />}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
        <span style={{ 
          fontWeight: 600, 
          color: 'var(--text-title)',
          fontSize: '12px',
          lineHeight: '1.3',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '3px'
          }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default QuickToolCard;
