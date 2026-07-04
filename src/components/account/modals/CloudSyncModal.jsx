import React from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CheckCircle, LogOut } from 'lucide-react';
import { APPLICATION } from '../../../config/application';

const CloudSyncModal = ({ 
  isOpen, 
  onClose,
  cloudSyncEnabled, setCloudSyncEnabled,
  userEmail, setUserEmail,
  userRole, isAuthorized, setIsAuthorized
}) => {
  if (!isOpen) return null;

  const target = typeof document !== 'undefined' ? (document.getElementById('app-root') || document.body) : null;
  if (!target) return null;

  return createPortal(
    <>
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />
      <div 
        className="fade-in"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--bg-app)',
          width: '90%',
          maxWidth: '400px',
          borderRadius: '16px',
          zIndex: 10000,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={20} color="var(--accent-blue)" /> Cloud Synchronization
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Keep your projects, schedule, and settings synced across all your devices securely in real-time.
          </p>
        </div>
        
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)' }}>Enable Cloud Sync</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={cloudSyncEnabled}
                onChange={(e) => {
                  setCloudSyncEnabled(e.target.checked);
                  localStorage.setItem(APPLICATION.storageKeys.cloudSync, e.target.checked.toString());
                  if (!e.target.checked && !userEmail) {
                    setIsAuthorized(true);
                  }
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          {cloudSyncEnabled && (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              {!userEmail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>Business Account Email</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="cloud-email-input"
                      type="email"
                      placeholder="Enter authorized email"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg-app)",
                        color: "var(--text-main)",
                        fontSize: "13px"
                      }}
                    />
                    <button
                      onClick={() => {
                        const emailVal = document.getElementById("cloud-email-input")?.value?.toLowerCase()?.trim();
                        if (!emailVal || !emailVal.includes("@")) {
                          alert("Please enter a valid email address!");
                          return;
                        }
                        setUserEmail(emailVal);
                        localStorage.setItem(APPLICATION.storageKeys.userEmail, emailVal);
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        backgroundColor: "var(--accent-gold-dark)",
                        color: "white",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected Account</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)", marginTop: '4px' }}>{userEmail}</span>
                    </div>
                    {isAuthorized && <CheckCircle size={18} color="#22c55e" />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", fontSize: "12px" }}>
                    <span>Role: <strong style={{ color: "var(--accent-gold)" }}>{(userRole || "editor").toUpperCase()}</strong></span>
                    <span>Status: {isAuthorized ? <strong style={{ color: "#22c55e" }}>AUTHORIZED</strong> : <strong style={{ color: "#ef4444" }}>PENDING</strong>}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-card)' }}>
          {userEmail && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout and disconnect from cloud sync?")) {
                  setUserEmail("");
                  localStorage.removeItem(APPLICATION.storageKeys.userEmail);
                  localStorage.removeItem(APPLICATION.storageKeys.userRole);
                  setIsAuthorized(true);
                }
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              backgroundColor: "var(--text-title)",
              color: "var(--bg-app)",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: 'auto'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>,
    target
  );
};

export default CloudSyncModal;
