import React from 'react';

const Avatar = ({ initials, imageUrl, size = 60, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'var(--bg-card)',
        border: '2px solid rgba(212, 175, 55, 0.7)',
        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.15), inset 0 2px 10px rgba(212, 175, 55, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: imageUrl ? `url(${imageUrl}) center/cover` : 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
        color: imageUrl ? 'transparent' : 'white',
        fontSize: `${size * 0.4}px`,
        fontWeight: '800',
        letterSpacing: '1px',
        fontFamily: "'Playfair Display', 'Cinzel', 'Times New Roman', serif",
        fontStyle: "italic",
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0
      }}
    >
      {!imageUrl && initials}
    </div>
  );
};

export default Avatar;
