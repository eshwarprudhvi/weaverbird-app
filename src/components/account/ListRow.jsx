import React from 'react';
import { ChevronRight } from 'lucide-react';

const ListRow = ({ icon: Icon, title, onClick, rightElement, borderBottom = true, iconColor = "var(--text-muted)" }) => {
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
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {Icon && <Icon size={20} color={iconColor} />}
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightElement && rightElement}
        {onClick && !rightElement && <ChevronRight size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />}
      </div>
    </div>
  );
};

export default ListRow;
