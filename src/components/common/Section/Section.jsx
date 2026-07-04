import React from 'react';

const Section = ({ title, children, className = '', style = {} }) => {
  return (
    <div className={`common-section ${className}`} style={{ marginBottom: '24px', ...style }}>
      {title && (
        <h3 style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          color: 'var(--text-title)', 
          marginBottom: '12px',
          paddingLeft: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  );
};

export default Section;
