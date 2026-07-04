import React from 'react';
import { createPortal } from 'react-dom';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const target = typeof document !== 'undefined' ? (document.getElementById('app-root') || document.body) : null;
  if (!target) return null;

  return createPortal(
    <>
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-app)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          zIndex: 10000,
          boxShadow: 'var(--shadow-phone)',
          padding: '24px 24px calc(24px + env(safe-area-inset-bottom, 0px)) 24px',
          maxHeight: '85%',
          overflowY: 'auto',
          transform: 'translateY(0)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px' }} />
        </div>
        {title && <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-title)', textAlign: 'center' }}>{title}</h3>}
        {children}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>,
    target
  );
};

export default BottomSheet;
