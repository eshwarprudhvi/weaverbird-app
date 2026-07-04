import React from 'react';

const Card = ({ children, className = '', style = {}, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`common-card ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default Card;
