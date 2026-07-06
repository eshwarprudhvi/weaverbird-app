import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Shield, MessageSquare, AlertCircle, Building2 } from 'lucide-react';
import invitationRepository from '../../../repositories/InvitationRepository';

export default function WorkspaceInvitationsModal({ isOpen, invitations = [], onClose, onAccepted, onDeclined, onSwitchWorkspace }) {
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [acceptedWorkspace, setAcceptedWorkspace] = useState(null); // { id, name }

  if (!isOpen || invitations.length === 0) return null;

  const handleAccept = async (inv) => {
    setProcessingId(inv.id);
    setErrorMsg(null);
    try {
      console.log(`[WorkspaceInvitationsModal] Accepting invitation: ${inv.id}`);
      const res = await invitationRepository.accept(inv.id);
      
      // Notify parent to update pending list
      if (onAccepted) {
        onAccepted(inv.id);
      }
      
      // Transition view to the switch confirmation
      setAcceptedWorkspace({
        id: res.workspaceId,
        name: res.workspaceName || inv.workspaceName || 'New Workspace'
      });
    } catch (err) {
      console.error('[WorkspaceInvitationsModal] Accept invitation failed:', err);
      setErrorMsg(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inv) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;
    setProcessingId(inv.id);
    setErrorMsg(null);
    try {
      console.log(`[WorkspaceInvitationsModal] Declining invitation: ${inv.id}`);
      await invitationRepository.decline(inv.id);
      if (onDeclined) {
        onDeclined(inv.id);
      }
    } catch (err) {
      console.error('[WorkspaceInvitationsModal] Decline invitation failed:', err);
      setErrorMsg(err.message || 'Failed to decline invitation.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRoleDisplay = (roleStr) => {
    if (!roleStr) return 'Member';
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={acceptedWorkspace ? undefined : onClose} style={{ zIndex: 3000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: '24px' }}>
        
        {acceptedWorkspace ? (
          // Success/Switch View
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <CheckCircle size={36} />
              </div>
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0' }}>
              Invitation Accepted!
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              You are now a collaborator on the workspace <strong style={{ color: '#fff' }}>{acceptedWorkspace.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  onSwitchWorkspace(acceptedWorkspace.id);
                  onClose();
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Switch Now
              </button>
              
              <button
                onClick={() => {
                  setAcceptedWorkspace(null);
                  if (invitations.length === 0) {
                    onClose();
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Later
              </button>
            </div>
          </div>
        ) : (
          // Main Pending Invitations List
          <>
            <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--accent-gold)" /> Workspace Invitations
              </h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close modal" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <XCircle size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {invitations.map((inv) => {
                const isProcessing = processingId === inv.id;
                return (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '18px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                          {inv.workspaceName || 'Studio Workspace'}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Invited by <strong style={{ color: 'var(--text-secondary)' }}>{inv.createdBy || 'Administrator'}</strong>
                        </span>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        <Shield size={12} />
                        {formatRoleDisplay(inv.role)}
                      </span>
                    </div>

                    {inv.message && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderLeft: '3px solid #6366f1',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <MessageSquare size={14} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>"{inv.message}"</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>Sent on {formatDate(inv.createdAt)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        onClick={() => handleAccept(inv)}
                        disabled={!!processingId}
                        style={{
                          flex: 1,
                          padding: '10px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: processingId ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1,
                          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
                        }}
                      >
                        {isProcessing ? 'Joining...' : <><CheckCircle size={14} /> Accept</>}
                      </button>

                      <button
                        onClick={() => handleDecline(inv)}
                        disabled={!!processingId}
                        style={{
                          flex: 1,
                          padding: '10px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: processingId ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
