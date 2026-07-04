import React from 'react';
import { ChevronRight } from 'lucide-react';

const QuickToolCard = ({ icon: Icon, title, subtitle, onClick, iconColor = "var(--text-main)", bgColor = "var(--bg-card)" }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: bgColor,
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        gap: '12px'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {Icon && <Icon size={20} color={iconColor} />}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <span style={{ 
          fontWeight: 600, 
          color: 'var(--text-title)',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
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
            marginTop: '2px'
          }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', opacity: 0.5 }}>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  );
};

export default QuickToolCard;
