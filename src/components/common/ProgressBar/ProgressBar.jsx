import React from 'react';

const ProgressBar = ({ progress, label, color = 'var(--accent-gold)' }) => {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
          <span style={{ color: 'var(--text-main)' }}>{label}</span>
          <span style={{ color: color }}>{progress}%</span>
        </div>
      )}
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: 'var(--border)', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
};

export default ProgressBar;
